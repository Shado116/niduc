from typing import Any, Dict, Optional, Tuple
import numpy as np


class RayleighChannel:
    _PARAM_NAME: str = "Scale"
    _PARAM_INFO: Dict[str, Any] = {
        "unit": "σ",
        "default": 0.707,
        "min": 0.1,
        "max": 2.0,
        "step": 0.001,
        "uses_seed": True,
        "supports_equalization": True,
    }

    def __init__(self, scale: float = 0.707, seed: Optional[int] = None):
        self.scale = scale
        self.seed = seed
        self._rng = np.random.default_rng(seed)

    @property
    def param_name(self) -> str:
        return self._PARAM_NAME

    @property
    def param_info(self) -> Dict[str, Any]:
        return self._PARAM_INFO

    def apply(self, symbols: np.ndarray, ctx: Dict[str, Any]) -> Tuple[np.ndarray, Dict[str, Any]]:
        num_symbols = len(symbols)
        if num_symbols == 0:
            return symbols, ctx

        h_i = self._rng.normal(loc=0.0, scale=self.scale, size=num_symbols)
        h_q = self._rng.normal(loc=0.0, scale=self.scale, size=num_symbols)

        h = h_i + 1j * h_q

        ctx.setdefault("equalizers", {})["rayleigh"] = lambda rx_symbols: rx_symbols / h

        return symbols * h, ctx