async function request(url, options) {
    const response = await fetch(url, options);

    if (!response.ok) {
        let errorMsg = `Błąd HTTP ${response.status}`;
        try {
            const errData = await response.json();
            // FastAPI zwraca treść błędu w polu 'detail' lub 'message'
            errorMsg = errData.detail || errData.message || errorMsg;
        } catch {
            // Brak poprawnego JSON-a w odpowiedzi błędu (fallback)
        }
        throw new Error(errorMsg);
    }

    return response.json();
}

export const fetchCapabilities = () => request('/api/capabilities');

export const postSimulation = (payload) => request('/api/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
});

export const postBenchmarkSweep = (payload) => request('/api/benchmark/sweep', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
});