import numpy as np


class QPSKModulation:
    _SQRT2_INV: float = 1.0 / np.sqrt(2.0)

    @staticmethod
    def modulate(bits: np.ndarray) -> np.ndarray:
        if len(bits) == 0:
            return np.array([], dtype=complex)

        if len(bits) % 2 != 0:
            raise ValueError(
                f"Niepoprawna długość ciągu bitów dla QPSK: {len(bits)}. "
                "Liczba bitów musi być podzielna przez 2 (2 bity / symbol)."
            )

        bit_pairs = bits.reshape(-1, 2)
        i_comp = QPSKModulation._SQRT2_INV * (1.0 - 2.0 * bit_pairs[:, 0])
        q_comp = QPSKModulation._SQRT2_INV * (1.0 - 2.0 * bit_pairs[:, 1])
        return i_comp + 1j * q_comp

    @staticmethod
    def demodulate(symbols: np.ndarray) -> np.ndarray:
        if len(symbols) == 0:
            return np.array([], dtype=int)

        b0 = np.where(np.real(symbols) < 0.0, 1, 0)
        b1 = np.where(np.imag(symbols) < 0.0, 1, 0)

        return np.column_stack((b0, b1)).ravel()