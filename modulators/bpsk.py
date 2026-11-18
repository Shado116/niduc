import numpy as np

class BPSKModulation:
    @staticmethod
    def modulate(bits: np.ndarray) -> np.ndarray:
        return np.where(bits == 0, -1.0 + 0j, 1.0 + 0j)

    @staticmethod
    def demodulate(symbols: np.ndarray) -> np.ndarray:
        return np.where(np.real(symbols) > 0, 1, 0)
