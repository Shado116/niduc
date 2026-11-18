import { $, $$ } from './utils.js';

let current = 1;

/** Przełącza krok kreatora i aktualizuje pasek postępu. */
export function goToStep(n) {
    const goingBack = n < current;
    $$('.step').forEach(el => el.classList.remove('active', 'back'));
    const el = $(`#step-${n}`);
    el.classList.add('active');
    el.classList.toggle('back', goingBack);
    current = n;
    updateStepper(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStepper(n) {
    $$('.stepper-item').forEach(item => {
        const s = +item.dataset.step;
        item.classList.toggle('active', s === n);
        item.classList.toggle('done', s < n);
        $('.stepper-dot', item).textContent = s < n ? '✓' : s;
    });
    $$('.stepper-bar').forEach((bar, i) => bar.classList.toggle('full', i + 1 < n));
}