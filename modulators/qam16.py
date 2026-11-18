import numpy as np

class QAM16Modulation:
    _bit_pair_to_amplitude = {
        (0, 0): -3.0,
        (0, 1): -1.0,
        (1, 1): 1.0,
        (1, 0): 3.0,
    }

    _amplitude_to_bit_pair = {v: k for k, v in _bit_pair_to_amplitude.items()}

    def __init__(self):
        self.bits_per_symbol = 4
        self.norm_factor = np.sqrt(10.0)

    def modulate(self, bits: np.ndarray) -> np.ndarray:
        bits = np.asarray(bits, dtype=int)
        if bits.ndim != 1 or len(bits) % self.bits_per_symbol != 0:
            raise ValueError(f"Liczba bitów musi być jednowymiarowa i podzielna przez {self.bits_per_symbol}.")

        bit_groups = bits.reshape(-1, self.bits_per_symbol)
        i_amplitudes = np.array([self._bit_pair_to_amplitude[tuple(b_pair)] for b_pair in bit_groups[:, :2]])
        q_amplitudes = np.array([self._bit_pair_to_amplitude[tuple(b_pair)] for b_pair in bit_groups[:, 2:]])
        symbols = (i_amplitudes + 1j * q_amplitudes) / self.norm_factor
        return symbols

    @staticmethod
    def _slice_component(x: np.ndarray) -> np.ndarray:
        conditions = [x <= -2.0, (x > -2.0) & (x <= 0.0), (x > 0.0) & (x <= 2.0)]
        choices = [-3.0, -1.0, 1.0, 3.0]
        return np.select(conditions, choices[0:3], default=choices[3])

    def demodulate(self, received_symbols: np.ndarray) -> np.ndarray:
        rx_symbols = np.asarray(received_symbols, dtype=complex)
        scaled_symbols = rx_symbols * self.norm_factor

        i_sliced = self._slice_component(np.real(scaled_symbols))
        q_sliced = self._slice_component(np.imag(scaled_symbols))

        demodulated_bits = []
        for i_val, q_val in zip(i_sliced, q_sliced):
            i_bits = self._amplitude_to_bit_pair[float(i_val)]
            q_bits = self._amplitude_to_bit_pair[float(q_val)]
            demodulated_bits.extend(i_bits)
            demodulated_bits.extend(q_bits)

        return np.array(demodulated_bits, dtype=int)