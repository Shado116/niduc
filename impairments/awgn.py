from typing import Any, Dict, Optional, Tuple
import numpy as np

class AWGNChannel:
    _PARAM_NAME: str = "SNR"
    _PARAM_INFO: Dict[str, Any] = {
        "unit": "dB",
        "default": 12.0,
        "min": -5.0,
        "max": 30.0,
        "step": 0.5,
        "uses_seed": True,
    }

    def __init__(self, snr_db: float, seed: Optional[int] = None):
        self.snr_db = snr_db
        self.seed = seed
        self._rng = np.random.default_rng(seed)

    @property
    def param_name(self) -> str:
        return self._PARAM_NAME

    @property
    def param_info(self) -> Dict[str, Any]:
        return self._PARAM_INFO

    def apply(self, symbols: np.ndarray, ctx: Dict[str, Any]) -> Tuple[np.ndarray, Dict[str, Any]]:
        if len(symbols) == 0:
            return symbols, ctx

        e_s = float(np.mean(np.abs(symbols) ** 2))
        if e_s == 0.0:
            return symbols, ctx

        snr_linear = 10.0 ** (self.snr_db / 10.0)
        sigma = np.sqrt(e_s / (2.0 * snr_linear))

        num_symbols = len(symbols)

        noise_i = self._rng.standard_normal(num_symbols) * sigma
        noise_q = self._rng.standard_normal(num_symbols) * sigma

        return symbols + (noise_i + 1j * noise_q), ctx