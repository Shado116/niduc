from typing import Any, Dict, Tuple
import numpy as np


class FrequencyOffsetChannel:
    _PARAM_NAME: str = "Offset"
    _PARAM_INFO: Dict[str, Any] = {
        "unit": "Hz",
        "default": 0.01,
        "min": -0.5,
        "max": 0.5,
        "step": 0.001,
        "uses_seed": False,
        "supports_equalization": True,

    }

    def __init__(self, norm_offset: float):
        self.norm_offset = norm_offset

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

        k = np.arange(num_symbols)
        phase = 2.0 * np.pi * self.norm_offset * k
        rotation = np.exp(1j * phase)

        ctx.setdefault("equalizers", {})["frequencyoffset"] = lambda rx_symbols: rx_symbols * np.exp(-1j * phase)

        return symbols * rotation, ctx