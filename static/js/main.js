import { $, esc, restartAnimation } from './utils.js';
import { fetchCapabilities, postSimulation } from './api.js';
import { syncSourceInputs, validateSource } from './source.js';
import { goToStep } from './wizard.js';
import { renderNoises, showNoisesError, initDragSorting, validateEnabledNoises } from './noises.js';
import { buildState, summaryHtml } from './summary.js';
import { renderResults, initOverlays } from './results.js';

let state = null;   // ostatnio zbudowany stan: { source, modulation, noises, payload }

function goToChannel() {
    if (validateSource()) goToStep(2);
}

function goToSummary() {
    if (!validateEnabledNoises()) return;
    state = buildState();
    $('#summary-content').innerHTML = summaryHtml(state);
    $('#results').hidden = true;
    goToStep(3);
}

async function runSimulation() {
    const btn = $('#run-btn');
    const box = $('#results');
    box.hidden = false;
    box.innerHTML = '<span class="spinner"></span>Trwa symulacja...';
    btn.disabled = true;
    try {
        const data = await postSimulation(state.payload);
        restartAnimation(box);
        box.innerHTML = renderResults(data, state.payload);
    } catch (error) {
        box.innerHTML = `<p class="error">Błąd komunikacji z API:${esc(error.message)}. Sprawdź, czy serwer działa, i spróbuj ponownie.</p>`;
    } finally {
        btn.disabled = false;
    }
}

const ACTIONS = { 'to-channel': goToChannel, 'to-summary': goToSummary, 'run': runSimulation };


async function loadCapabilities() {
    try {
        const data = await fetchCapabilities();
        $('#modulation-type').innerHTML = data.modulations
            .map(m => `<option value="${esc(m)}">${esc(m)}</option>`).join('');
        renderNoises(data.noises);
    } catch (error) {
        console.error('Błąd pobierania capabilities:', error);
        showNoisesError('Nie udało się połączyć z API. Odśwież stronę, aby spróbować ponownie.');
    }
}

function init() {
    syncSourceInputs();
    window.addEventListener('pageshow', syncSourceInputs);   // przeglądarka mogła przywrócić stare wartości formularza
    document.querySelectorAll('input[name="source-type"]').forEach(r => r.addEventListener('change', syncSourceInputs));

    document.addEventListener('click', e => {
        const nav = e.target.closest('[data-goto]');
        if (nav) return goToStep(+nav.dataset.goto);
        const act = e.target.closest('[data-action]');
        if (act) ACTIONS[act.dataset.action]?.();
    });

    initDragSorting();
    initOverlays();
    loadCapabilities();
}

init();