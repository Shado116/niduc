import numpy as np
from typing import Optional


class BinaryRandomizer:
    @staticmethod
    def generate(num_bits: int, seed: Optional[int] = None) -> np.ndarray:
        rng = np.random.default_rng(seed)
        return rng.integers(0, 2, size=num_bits, dtype=np.int8)


if __name__ == "__main__":
    bits_A = BinaryRandomizer.generate(num_bits=1000, seed=1234)
    bits_B = BinaryRandomizer.generate(num_bits=1000, seed=1234)

    print(f"Próba A (seed 1234):\n {bits_A}")
    print(f"Próba B (seed 1234):\n {bits_B}")
    print(f"Czy są identyczne?   {np.array_equal(bits_A, bits_B)}\n")