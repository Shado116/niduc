import numpy as np

class DataConverter:
    @staticmethod
    def text_to_bits(text: str) -> np.ndarray:
        bytes_data = text.encode('utf-8')
        return np.unpackbits(np.frombuffer(bytes_data, dtype=np.uint8))

    @staticmethod
    def bits_to_text(bits: np.ndarray) -> str:
        bytes_data = np.packbits(bits).tobytes()
        return bytes_data.decode('utf-8', errors='replace')