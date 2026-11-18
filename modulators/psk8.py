import numpy as np


class PSK8Modulation:
    _GRAY_BITS = np.array(
        [
            [0, 0, 0],  # 0°   (0 rad)
            [0, 0, 1],  # 45°  (pi/4 rad)
            [0, 1, 1],  # 90°  (pi/2 rad)
            [0, 1, 0],  # 135° (3pi/4 rad)
            [1, 1, 0],  # 180° (pi rad)
            [1, 1, 1],  # 225° (5pi/4 rad)
            [1, 0, 1],  # 270° (3pi/2 rad)
            [1, 0, 0],  # 315° (7pi/4 rad)
        ],
        dtype=int,
    )

    _CONSTELLATION = np.exp(1j * np.array([i * np.pi / 4.0 for i in range(8)]))

    # Tabela LUT: zamiana trójki bitów b2|b1|b0 (dziesiętnie 0..7) na indeks kąta k
    _BIT_TRIPLET_TO_ANGLE_IDX = np.array([0, 1, 3, 2, 7, 6, 4, 5], dtype=int)

    @staticmethod
    def modulate(bits: np.ndarray) -> np.ndarray:
        if len(bits) == 0:
            return np.array([], dtype=complex)

        if len(bits) % 3 != 0:
            raise ValueError(
                f"Niepoprawna długość ciągu bitów dla 8-PSK: {len(bits)}. "
                "Liczba bitów musi być podzielna przez 3 (3 bity / symbol)."
            )

        triplets = bits.reshape(-1, 3)

        decimal_indices = (
            (triplets[:, 0] << 2) | (triplets[:, 1] << 1) | triplets[:, 2]
        )

        angle_indices = PSK8Modulation._BIT_TRIPLET_TO_ANGLE_IDX[
            decimal_indices
        ]

        return PSK8Modulation._CONSTELLATION[angle_indices]

    @staticmethod
    def demodulate(symbols: np.ndarray) -> np.ndarray:
        if len(symbols) == 0:
            return np.array([], dtype=int)

        angles = np.angle(symbols) % (2.0 * np.pi)

        sector_indices = (
            np.floor(((angles + np.pi / 8.0) % (2.0 * np.pi)) / (np.pi / 4.0))
        ).astype(int)

        return PSK8Modulation._GRAY_BITS[sector_indices].ravel()