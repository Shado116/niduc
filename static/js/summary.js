import { $, esc } from './utils.js';
import { readSource } from './source.js';
import { collectNoises } from './noises.js';

export function buildState() {
    const source = readSource();
    const modulation = $('#modulation-type').value;
    const noises = collectNoises();
    const payload = {
        source_type: source.type,
        source_content: source.content,
        source_seed: source.seed,
        modulation,
        noises: noises.map(({ noise_type, param_value, seed, equalize }) => ({
            noise_type,
            param_value,
            seed,
            equalize
        }))
    };
    return { source, modulation, noises, payload };
}

const noisePill = (n, i) => {
    const value = `${esc(n.param_name)} ${n.param_value}${n.unit ? ' ' + esc(n.unit) : ''}`;
    const seed = n.seed !== null ? `, seed ${n.seed}` : '';
    const eq = n.equalize === false ? ', bez EQ' : '';
    return `<span class="arrow">→</span><span class="pill n" style="--i:${i + 1}">${esc(n.noise_type)}<small>${value}${seed}${eq}</small></span>`;
};

export function summaryHtml({ source, modulation, noises }) {
    const src = source.type === 'random' ? `${esc(source.content)} losowych bitów` : `tekst (${source.content.length} znaków)`;
    const seedRow = source.type === 'random'
        ? `<div class="summary-row"><span>Seed wejścia</span><b>${source.seed ?? 'losowy'}</b></div>` : '';
    const chain = noises.length
        ? noises.map(noisePill).join('')
        : `<span class="arrow">→</span><span class="pill" style="--i:1">idealny kanał</span>`;

    return `
        <div class="summary-row"><span>Źródło</span><b>${src}</b></div>
        ${seedRow}
        <div class="summary-row"><span>Modulacja</span><b>${esc(modulation)}</b></div>
        <div class="flow">
            <span class="pill tx" style="--i:0">Nadajnik</span>${chain}
            <span class="arrow">→</span><span class="pill rx" style="--i:${noises.length + 2}">Odbiornik</span>
        </div>`;
}