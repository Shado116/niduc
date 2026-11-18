export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const getNullableInt = (v) => String(v ?? '').trim() === '' ? null : parseInt(v, 10);

export function restartAnimation(el) {
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
}