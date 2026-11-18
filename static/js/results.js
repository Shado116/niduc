import { esc } from "./utils.js";

// Limit komórek macierzy (N * M) dla algorytmu odległości edycyjnej (Levenshteina).
// Powyżej 4 milionów komórek przełączamy się na liniowe porównanie po indeksach, aby nie obciążać pamięci.
const MAX_DP_MATRIX_SIZE = 4e6;

// Maksymalna liczba bitów renderowana w drzewie DOM.
// Limit chroni przeglądarkę przed zamrożeniem przy gigantycznych ciągach bitów.
const MAX_RENDERED_BITS_LIMIT = 200000;

// Grupowanie bitów w bajty (po 8 bitów) dla czytelności.
const BITS_PER_BYTE_GROUP = 8;


// =========================================================================================
// ALGORYTM ALIGNMENTU DANYCH (LEVENSHTEIN DP)
// =========================================================================================

function compareDirectly(originalCharArray, receivedCharArray) {
    const n = originalCharArray.length;
    const m = receivedCharArray.length;
    const maxLength = Math.max(n, m);

    const originalErrorFlags = new Array(n).fill(false);
    const receivedErrorFlags = new Array(m).fill(false);

    for (let i = 0; i < maxLength; i++) {
        if (originalCharArray[i] !== receivedCharArray[i]) {
            if (i < n) originalErrorFlags[i] = true;
            if (i < m) receivedErrorFlags[i] = true;
        }
    }
    return { originalErrorFlags, receivedErrorFlags };
}

function buildDpMatrix(originalCharArray, receivedCharArray) {
    const n = originalCharArray.length;
    const m = receivedCharArray.length;
    const matrixWidth = m + 1;
    const dpMatrix = new Int32Array((n + 1) * matrixWidth);

    for (let i = 0; i <= n; i++) dpMatrix[i * matrixWidth] = i;
    for (let j = 0; j <= m; j++) dpMatrix[j] = j;

    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
            const substitutionCost = originalCharArray[i - 1] === receivedCharArray[j - 1] ? 0 : 1;

            dpMatrix[i * matrixWidth + j] = Math.min(
                dpMatrix[(i - 1) * matrixWidth + j] + 1,
                dpMatrix[i * matrixWidth + j - 1] + 1,
                dpMatrix[(i - 1) * matrixWidth + j - 1] + substitutionCost
            );
        }
    }
    return { dpMatrix, matrixWidth };
}

function backtrackErrors(dpMatrix, matrixWidth, originalCharArray, receivedCharArray) {
    let i = originalCharArray.length;
    let j = receivedCharArray.length;

    const originalErrorFlags = new Array(i).fill(false);
    const receivedErrorFlags = new Array(j).fill(false);

    while (i > 0 || j > 0) {
        const substitutionCost = (i > 0 && j > 0) ? (originalCharArray[i - 1] === receivedCharArray[j - 1] ? 0 : 1) : null;
        const currentCellCost = dpMatrix[i * matrixWidth + j];

        if (substitutionCost !== null && currentCellCost === dpMatrix[(i - 1) * matrixWidth + (j - 1)] + substitutionCost) {
            if (substitutionCost > 0) {
                originalErrorFlags[i - 1] = true;
                receivedErrorFlags[j - 1] = true;
            }
            i--;
            j--;
        } else if (i > 0 && currentCellCost === dpMatrix[(i - 1) * matrixWidth + j] + 1) {
            originalErrorFlags[i - 1] = true;
            i--;
        } else {
            receivedErrorFlags[j - 1] = true;
            j--;
        }
    }

    return { originalErrorFlags, receivedErrorFlags };
}

/**
 * Główna funkcja wyrównująca ciągi znaków (orchestrator).
 */
export function alignCharacters(originalText, receivedText) {
    const originalCharArray = [...originalText];
    const receivedCharArray = [...receivedText];
    const n = originalCharArray.length;
    const m = receivedCharArray.length;

    // 1. Szybka ścieżka dla przypadków prostych lub zbyt dużych
    if (n === m || (n * m) > MAX_DP_MATRIX_SIZE) {
        const { originalErrorFlags, receivedErrorFlags } = compareDirectly(originalCharArray, receivedCharArray);
        return { originalCharArray, receivedCharArray, originalErrorFlags, receivedErrorFlags };
    }

    // 2. Budowanie macierzy DP
    const { dpMatrix, matrixWidth } = buildDpMatrix(originalCharArray, receivedCharArray);

    // 3. Backtracking i oznaczanie błędów
    const { originalErrorFlags, receivedErrorFlags } = backtrackErrors(dpMatrix, matrixWidth, originalCharArray, receivedCharArray);

    return {
        originalCharArray,
        receivedCharArray,
        originalErrorFlags,
        receivedErrorFlags
    };
}

/**
 * Podświetla błędne znaki w kodzie HTML tagami <mark>.
 */
function highlightCharacterMarkup(characterArray, errorFlagsArray, cssClassName) {
    return characterArray.map((character, i) => {
        const formattedCharacter = character === '\n' ? '↵\n' : esc(character);
        const isCorrupted = errorFlagsArray[i];

        return isCorrupted ? `<mark class="${cssClassName}">${formattedCharacter}</mark>` : formattedCharacter;
    }).join('');
}


// =========================================================================================
// OBSŁUGA INTERFEJSU (OVERLAY & SWITCHING)
// =========================================================================================

function generateOverlayHtml({ summaryText, originalHtml, receivedHtml, isMonospace }) {
    return `
        <p class="hint" style="margin:1.25rem 0 .6rem">${summaryText}</p>
        <div class="overlay" data-view="b">
            <div class="overlay-bar">
                <span class="overlay-state"><i class="dot"></i><b>Po</b> <span>odebrano (czerwone = błędy)</span></span>
                <button type="button" class="btn ghost sm" data-flip>Pokaż oryginał</button>
            </div>
            <div class="overlay-box${isMonospace ? ' mono' : ''}" tabindex="0" role="button" aria-pressed="false" title="Kliknij lub dotknij, aby przełączyć">
                <div class="layer layer-a" aria-hidden="true">${originalHtml}</div>
                <div class="layer layer-b">${receivedHtml}</div>
            </div>
        </div>`;
}

function toggleOverlayView(overlayContainerElement) {
    const isShowingOriginal = overlayContainerElement.dataset.view !== 'a';
    overlayContainerElement.dataset.view = isShowingOriginal ? 'a' : 'b';

    const stateIndicatorElement = overlayContainerElement.querySelector('.overlay-state');
    stateIndicatorElement.innerHTML = isShowingOriginal
        ? '<i class="dot a"></i><b>Przed</b> <span>oryginał (pomarańczowe = tu wystąpił błąd)</span>'
        : '<i class="dot"></i><b>Po</b> <span>odebrano (czerwone = błędy)</span>';

    const flipButtonElement = overlayContainerElement.querySelector('[data-flip]');
    flipButtonElement.textContent = isShowingOriginal ? 'Pokaż odebrany' : 'Pokaż oryginał';

    const overlayBoxElement = overlayContainerElement.querySelector('.overlay-box');
    overlayBoxElement.setAttribute('aria-pressed', String(isShowingOriginal));

    const originalLayerElement = overlayContainerElement.querySelector('.layer-a');
    const receivedLayerElement = overlayContainerElement.querySelector('.layer-b');

    originalLayerElement.setAttribute('aria-hidden', String(!isShowingOriginal));
    receivedLayerElement.setAttribute('aria-hidden', String(isShowingOriginal));
}

export function initOverlays() {
    document.addEventListener('click', event => {
        const interactiveTarget = event.target.closest('[data-flip], .overlay-box');
        if (!interactiveTarget) return;

        // MAGIA / UX RULE: Zaznaczanie tekstu myszką nie powinno przełączać widoku
        if (interactiveTarget.matches('.overlay-box') && String(getSelection())) return;

        toggleOverlayView(interactiveTarget.closest('.overlay'));
    });

    document.addEventListener('keydown', event => {
        if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.overlay-box')) {
            event.preventDefault();
            toggleOverlayView(event.target.closest('.overlay'));
        }
    });
}


// =========================================================================================
// PORÓWNYWANIE TEKSTU ORAZ BITÓW
// =========================================================================================

export function renderTextCompare(originalText, receivedText) {
    const {
        originalCharArray,
        receivedCharArray,
        originalErrorFlags,
        receivedErrorFlags
    } = alignCharacters(originalText, receivedText);

    const corruptedCharacterCount = originalErrorFlags.filter(Boolean).length;

    return generateOverlayHtml({
        summaryText: corruptedCharacterCount
            ? `Zniekształconych znaków: <b class="error">${corruptedCharacterCount}</b> z ${originalCharArray.length}.`
            : 'Tekst odebrany bez błędów.',
        originalHtml: highlightCharacterMarkup(originalCharArray, originalErrorFlags, 'lost'),
        receivedHtml: highlightCharacterMarkup(receivedCharArray, receivedErrorFlags, 'err')
    });
}

const normalizeToBitString = (rawBitData) => {
    if (Array.isArray(rawBitData)) return rawBitData.join('');
    return String(rawBitData ?? '').replace(/[^01]/g, '');
};

function generateBitsMarkup(primaryBitString, referenceBitString, cssClassName, bitDisplayLimit) {
    const markupOutputBuffer = [];
    let isHighlightTagOpen = false;

    for (let i = 0; i < bitDisplayLimit; i++) {
        const isBitCorrupted = primaryBitString[i] !== referenceBitString[i];

        if (isBitCorrupted && !isHighlightTagOpen) {
            markupOutputBuffer.push(`<mark class="${cssClassName}">`);
            isHighlightTagOpen = true;
        }
        if (!isBitCorrupted && isHighlightTagOpen) {
            markupOutputBuffer.push('</mark>');
            isHighlightTagOpen = false;
        }

        // MAGIC VALUE: '–' jako symbol braku znaku przy różnicach w długościach ciągów
        markupOutputBuffer.push(primaryBitString[i] ?? '–');

        // Co 8 bitów dodajemy spację rozdzielającą bajty
        if (i % BITS_PER_BYTE_GROUP === (BITS_PER_BYTE_GROUP - 1)) {
            // POPRAWKA: Jeśli tag <mark> jest w tym miejscu otwarty, zamykamy go PRZED spacją
            if (isHighlightTagOpen) {
                markupOutputBuffer.push('</mark>');
                isHighlightTagOpen = false;
            }
            markupOutputBuffer.push(' ');
        }
    }

    if (isHighlightTagOpen) {
        markupOutputBuffer.push('</mark>');
    }

    return markupOutputBuffer.join('');
}

export function renderBitCompare(simulationData) {
    const sentBitString = normalizeToBitString(simulationData.original_bits);
    const receivedBitString = normalizeToBitString(simulationData.received_bits);

    if (!sentBitString || !receivedBitString) {
        return '<p class="hint" style="margin-top:1.25rem">API nie zwróciło ciągów bitów. Dodaj do odpowiedzi pola <code>original_bits</code> i <code>received_bits</code> (ciągi znaków 0 i 1).</p>';
    }

    const maxBitLength = Math.max(sentBitString.length, receivedBitString.length);
    let totalBitErrors = 0;

    for (let i = 0; i < maxBitLength; i++) {
        if (sentBitString[i] !== receivedBitString[i]) {
            totalBitErrors++;
        }
    }

    const displayedBitCount = Math.min(maxBitLength, MAX_RENDERED_BITS_LIMIT);

    return generateOverlayHtml({
        isMonospace: true,
        summaryText: (totalBitErrors
            ? `Błędnych bitów: <b class="error">${totalBitErrors}</b> z ${maxBitLength}.`
            : 'Ciągi są identyczne.') +
            (maxBitLength > displayedBitCount ? ` Wyświetlono pierwsze ${displayedBitCount} bitów.` : ''),
        originalHtml: generateBitsMarkup(sentBitString, receivedBitString, 'lost', displayedBitCount),
        receivedHtml: generateBitsMarkup(receivedBitString, sentBitString, 'err', displayedBitCount)
    });
}


// =========================================================================================
// RENDEROWANIE WYNIKÓW
// =========================================================================================

export function renderResults(simulationData, requestPayload) {
    let outputHtml = `
        <h4>Wynik symulacji</h4>
        <div class="stats">
            <div class="stat"><small>Status</small><b>${esc(simulationData.status)}</b></div>
            <div class="stat"><small>BER</small><b>${esc(simulationData.ber)}</b></div>
            <div class="stat"><small>Błędne bity</small><b>${esc(simulationData.errors)} / ${esc(simulationData.total_bits)}</b></div>
        </div>`;

    if (requestPayload.source_type === 'text') {
        if (typeof simulationData.reconstructed_text === 'string') {
            outputHtml += renderTextCompare(requestPayload.source_content, simulationData.reconstructed_text);
        }
    } else {
        outputHtml += renderBitCompare(simulationData);
    }

    return outputHtml;
}