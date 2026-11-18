from typing import Any, Dict, Tuple
import numpy as np

class IQPhaseImbalanceChannel:
    _PARAM_NAME: str = "Phase Skew"
    _PARAM_INFO: Dict[str, Any] = {
        "unit": "°",
        "default": 5.0,
        "min": -25.0,
        "max": 25.0,
        "step": 0.5,
        "uses_seed": False,
    }

    def __init__(self, skew_deg: float):
        self.skew_deg = skew_deg

    @property
    def param_name(self) -> str:
        return self._PARAM_NAME

    @property
    def param_info(self) -> Dict[str, Any]:
        return self._PARAM_INFO

    def apply(self, symbols: np.ndarray, ctx: Dict[str, Any]) -> Tuple[np.ndarray, Dict[str, Any]]:
        if len(symbols) == 0:
            return symbols, ctx

        skew_rad = np.radians(self.skew_deg)
        i_in = np.real(symbols)
        q_in = np.imag(symbols)

        i_out = i_in
        q_out = q_in * np.cos(skew_rad) + i_in * np.sin(skew_rad)

        return i_out + 1j * q_out, ctx