from typing import Protocol, Any, Dict, Tuple
import numpy as np

class NoiseStrategy(Protocol):
    def apply(self, symbols: np.ndarray, ctx: Dict[str, Any]) -> Tuple[np.ndarray, Dict[str, Any]]:
        ...

    @property
    def param_name(self) -> str:
        ...

    @property
    def param_info(self) -> Dict[str, Any]:
        ...