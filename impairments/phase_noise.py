from typing import Any, Dict, Optional, Tuple
import numpy as np

class PhaseNoiseChannel:
    _PARAM_NAME: str = "Jitter"
    _PARAM_INFO: Dict[str, Any] = {
        "unit": "°",
        "default": 5.0,
        "min": 0.0,
        "max": 45.0,
        "step": 0.5,
        "uses_seed": True,
    }

    def __init__(self, std_dev_deg: float, seed: Optional[int] = None):
        self.std_dev_deg = std_dev_deg
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

        std_dev_rad = np.radians(self.std_dev_deg)
        phase_drift = self._rng.normal(loc=0.0, scale=std_dev_rad, size=len(symbols))

        return symbols * np.exp(1j * phase_drift), ctx