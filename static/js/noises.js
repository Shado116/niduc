import { $, $$, esc, getNullableInt } from './utils.js';

const ICONS = {
    grip: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="5" cy="3" r="1.4"/><circle cx="11" cy="3" r="1.4"/><circle cx="5" cy="8" r="1.4"/><circle cx="11" cy="8" r="1.4"/><circle cx="5" cy="13" r="1.4"/><circle cx="11" cy="13" r="1.4"/></svg>',
    up: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10l5-5 5 5"/></svg>',
    down: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6l5 5 5-5"/></svg>'
};

const list = () => $('#noise-container');
const has = (v) => v !== undefined && v !== null;

// ---------- BUDOWA KART ----------

function paramFieldHtml({ param_name, param_info: p }, i) {
    const attrs = [['min', p.min], ['max', p.max], ['step', p.step ?? 'any'], ['value', p.default]]
        .filter(([, v]) => has(v))
        .map(([k, v]) => `${k}="${esc(v)}"`).join(' ');
    const unit = p.unit ? ` <span class="unit">[${esc(p.unit)}]</span>` : '';
    const range = [
        has(p.min) && has(p.max) ? `zakres ${p.min} … ${p.max}${p.unit ? ' ' + p.unit : ''}` : '',
        has(p.step) ? `krok ${p.step}` : ''
    ].filter(Boolean).join(' · ');
    const hint = [p.label, range].filter(Boolean).join(' · ');
    return `
        <div>
            <label class="field" for="param-${i}">${esc(param_name)}${unit}</label>
            <input type="number" id="param-${i}" data-role="param" required ${attrs}>
            ${hint ? `<small class="range-hint">${esc(hint)}</small>` : ''}
        </div>`;
}

const seedFieldHtml = (i) => `
    <div>
        <label class="field" for="seed-${i}">Seed (opcjonalnie)</label>
        <input type="number" id="seed-${i}" data-role="seed" step="1" min="0" placeholder="losowy">
    </div>`;

const equalizeFieldHtml = (i) => `
    <div class="equalize-row">
        <label class="field" for="equalize-${i}">Kompensacja w odbiorniku (Equalizer)</label>
        <label class="switch sm signal">
            <input type="checkbox" id="equalize-${i}" data-role="equalize" checked>
            <span></span>
        </label>
    </div>`;

function cardHtml(noise, i) {
    const usesSeed = noise.param_info.uses_seed;
    const supportsEq = Boolean(noise.param_info.supports_equalization);

    return `
        <div class="noise-row">
            <span class="drag-handle" title="Przeciągnij, aby zmienić kolejność">${ICONS.grip}</span>
            <span class="order-badge"></span>
            <label class="noise-name" for="noise-${i}">${esc(noise.name)}</label>
            <div class="move-btns">
                <button type="button" class="icon-btn" data-move="-1" aria-label="Przesuń wyżej">${ICONS.up}</button>
                <button type="button" class="icon-btn" data-move="1" aria-label="Przesuń niżej">${ICONS.down}</button>
            </div>
            <label class="switch">
                <input type="checkbox" id="noise-${i}" aria-label="Dodaj szum ${esc(noise.name)}">
                <span></span>
            </label>
        </div>
        <div class="config-wrap">
            <div class="config-box${usesSeed ? '' : ' single'}">
                ${paramFieldHtml(noise, i)}
                ${usesSeed ? seedFieldHtml(i) : ''}
                ${supportsEq ? equalizeFieldHtml(i) : ''}
            </div>
        </div>`;
}

function buildNoiseCard(noise, i) {
    const card = document.createElement('div');
    card.className = 'noise-card';
    card.dataset.noise = noise.name;
    card.dataset.paramName = noise.param_name;
    card.dataset.unit = noise.param_info.unit ?? '';
    card.innerHTML = cardHtml(noise, i);
    $('.config-wrap', card).inert = true;   // zwinięte pola nie łapią focusu z klawiatury
    bindToggle(card);
    bindMoveButtons(card);
    bindDrag(card, noise.name);
    return card;
}

export function renderNoises(noises) {
    const box = list();
    box.innerHTML = '';
    if (!noises.length) {
        box.innerHTML = '<p class="hint">Brak dostępnych szumów w systemie.</p>';
        return;
    }
    noises.forEach((noise, i) => box.appendChild(buildNoiseCard(noise, i)));
    refreshOrder();
}

export function showNoisesError(message) {
    list().innerHTML = `<p class="error">${esc(message)}</p>`;
}

// ---------- ZDARZENIA KARTY ----------

function bindToggle(card) {
    $('.noise-row input[type="checkbox"]', card).addEventListener('change', e => {
        card.classList.toggle('enabled', e.target.checked);
        $('.config-wrap', card).inert = !e.target.checked;
        refreshOrder();
    });
}

function bindMoveButtons(card) {
    $$('[data-move]', card).forEach(btn =>
        btn.addEventListener('click', () => moveCard(card, parseInt(btn.dataset.move, 10))));
}


function bindDrag(card, noiseName) {
    const handle = $('.drag-handle', card);
    handle.addEventListener('pointerdown', () => card.draggable = true);
    handle.addEventListener('pointerup', () => card.draggable = false);
    card.addEventListener('dragstart', e => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', noiseName);
        e.dataTransfer.setDragImage(card, 24, 24);
        requestAnimationFrame(() => card.classList.add('dragging'));
    });
    card.addEventListener('dragend', () => {
        card.draggable = false;
        card.classList.remove('dragging');
        refreshOrder();
    });
}

export function initDragSorting() {
    const box = list();
    box.addEventListener('dragover', e => {
        const dragging = $('.dragging', box);
        if (!dragging) return;
        e.preventDefault();
        const after = $$('.noise-card:not(.dragging)', box).find(c => {
            const r = c.getBoundingClientRect();
            return e.clientY < r.top + r.height / 2;
        }) || null;
        if (after === dragging.nextElementSibling) return;
        flip(() => box.insertBefore(dragging, after));
    });
    box.addEventListener('drop', e => e.preventDefault());
}

// ---------- KOLEJNOŚĆ ----------


function flip(mutate) {
    const cards = $$('.noise-card', list());
    const before = new Map(cards.map(c => [c, c.getBoundingClientRect().top]));
    mutate();
    cards.forEach(c => {
        const delta = before.get(c) - c.getBoundingClientRect().top;
        if (delta) c.animate([{ transform: `translateY(${delta}px)` }, { transform: 'none' }],
                             { duration: 280, easing: 'cubic-bezier(.2,.8,.2,1)' });
    });
    refreshOrder();
}

function moveCard(card, dir) {
    const target = dir < 0 ? card.previousElementSibling : card.nextElementSibling;
    if (!target) return;
    flip(() => dir < 0 ? list().insertBefore(card, target) : list().insertBefore(target, card));
    card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash');
}

function refreshOrder() {
    const cards = $$('.noise-card', list());
    let n = 0;
    cards.forEach((card, idx) => {
        $('.order-badge', card).textContent = card.classList.contains('enabled') ? ++n : '';
        $('[data-move="-1"]', card).disabled = idx === 0;
        $('[data-move="1"]', card).disabled = idx === cards.length - 1;
    });
}

// ---------- ODCZYT STANU ----------

export function validateEnabledNoises() {
    for (const input of $$('.noise-card.enabled input[data-role]', list())) {
        if (!input.checkValidity()) { input.reportValidity(); return false; }
    }
    return true;
}

export function collectNoises() {
    return $$('.noise-card.enabled', list()).map(card => {
        const eqCheckbox = $('[data-role="equalize"]', card);
        return {
            noise_type: card.dataset.noise,
            param_name: card.dataset.paramName,
            unit: card.dataset.unit,
            param_value: parseFloat($('[data-role="param"]', card).value),
            seed: getNullableInt($('[data-role="seed"]', card)?.value),
            equalize: eqCheckbox ? eqCheckbox.checked : true
        };
    });
}