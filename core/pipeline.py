import numpy as np
from typing import List, Tuple, Dict, Any, Optional, Set

from modulators import ModulationStrategy
from impairments import NoiseStrategy


class PipelineManager:
    def __init__(
        self,
        modulator: ModulationStrategy,
        noise_cascade: List[NoiseStrategy],
        enabled_equalizers: Optional[Set[str]] = None,
    ):
        self.modulator = modulator
        self.noise_cascade = noise_cascade
        self.enabled_equalizers: Set[str] = (
            enabled_equalizers if enabled_equalizers is not None else set()
        )

    @staticmethod
    def _ber(source_bits: np.ndarray, received_bits: np.ndarray) -> float:
        return float(np.mean(source_bits != received_bits))

    def _apply_noise_cascade(
        self, symbols: np.ndarray, ctx: Dict[str, Any]
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        for noise in self.noise_cascade:
            symbols, ctx = noise.apply(symbols, ctx)
        return symbols, ctx

    def run(self, source_bits: np.ndarray) -> Tuple[np.ndarray, float]:
        if source_bits.size == 0:
            return source_bits, 0.0

        symbols = self.modulator.modulate(source_bits)

        ctx: Dict[str, Any] = {"equalizers": {}}
        symbols, ctx = self._apply_noise_cascade(symbols, ctx)

        equalizers = ctx.get("equalizers", {})
        for name, eq_func in reversed(equalizers.items()):
            if name in self.enabled_equalizers:
                symbols = eq_func(symbols)

        received_bits = self.modulator.demodulate(symbols)

        return received_bits, self._ber(source_bits, received_bits)