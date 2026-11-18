import { $, getNullableInt } from './utils.js';

export const getSourceType = () => $('input[name="source-type"]:checked').value;

export function syncSourceInputs() {
    const random = getSourceType() === 'random';
    $('#source-random-wrapper').hidden = !random;
    $('#source-text-wrapper').hidden = random;
}

export function validateSource() {
    const type = getSourceType();
    const field = type === 'random' ? $('#source-bits') : $('#source-text');
    field.setCustomValidity(type === 'text' && !field.value.trim() ? 'Wpisz tekst do wysłania.' : '');
    return field.reportValidity();
}

export function readSource() {
    const type = getSourceType();
    return {
        type,
        content: type === 'random' ? $('#source-bits').value : $('#source-text').value,
        seed: type === 'random' ? getNullableInt($('#source-seed').value) : null
    };
}