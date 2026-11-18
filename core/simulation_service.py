from typing import List, Any, Dict
import numpy as np

from core.pipeline import PipelineManager
from core.seed_gen import BinaryRandomizer
from core.converter import DataConverter
from core.schemas import SimulationPayload

from modulators import AVAILABLE_MODULATORS, ModulationStrategy
from impairments import AVAILABLE_CHANNELS, NoiseStrategy


def get_capabilities() -> Dict[str, Any]:
    return {
        "modulations": list(AVAILABLE_MODULATORS),
        "noises": [
            {
                "name": name,
                "param_name": getattr(cls, "_PARAM_NAME", ""),
                "param_info": getattr(cls, "_PARAM_INFO", {}),
            }
            for name, cls in AVAILABLE_CHANNELS.items()
        ],
    }


class SimulationService:
    def __init__(self, payload: SimulationPayload):
        self.payload = payload

    def _prepare_source_bits(self) -> np.ndarray:
        if self.payload.source_type == "text":
            return DataConverter.text_to_bits(self.payload.source_content)

        num_bits = int(self.payload.source_content)
        return BinaryRandomizer.generate(num_bits, self.payload.source_seed)

    def _build_modulator(self) -> ModulationStrategy:
        mod_type = self.payload.modulation.upper()
        mod_class: ModulationStrategy | None = AVAILABLE_MODULATORS.get(mod_type)

        if not mod_class:
            raise ValueError(f"Nieobsługiwana modulacja: {self.payload.modulation}")

        return mod_class()

    @staticmethod
    def _validate_param(noise_type: str, value: float, info: Dict[str, Any]) -> None:
        low: float = info.get("min")
        high: float = info.get("max")
        if low is None or high is None:
            raise ValueError("Nie znaleziono wartości granicznych")

        if (value < low) or (value > high):
            raise ValueError(f"{noise_type}: wartość {value} poza zakresem [{low}, {high}]")

    def _build_noise_cascade(self) -> List[NoiseStrategy]:
        cascade = []

        channels_map = {name.lower(): cls for name, cls in AVAILABLE_CHANNELS.items()}

        for noise_cfg in self.payload.noises:
            raw_type = noise_cfg.noise_type
            noise_class = channels_map.get(raw_type.lower())

            if not noise_class:
                raise ValueError(f"Nieobsługiwany typ szumu: {raw_type}")

            info = getattr(noise_class, "_PARAM_INFO", {})
            self._validate_param(raw_type, noise_cfg.param_value, info)

            if info.get("uses_seed", True):
                cascade.append(
                    noise_class(noise_cfg.param_value, seed=noise_cfg.seed)
                )
            else:
                cascade.append(noise_class(noise_cfg.param_value))

        return cascade

    def _format_result(self, input_bits: np.ndarray, received_bits: np.ndarray, ber: float) -> Dict[str, Any]:
        original_str = "".join(input_bits.astype(str))
        received_str = "".join(received_bits.astype(str))

        result = {
            "status": "success",
            "ber": ber,
            "errors": round(ber * len(input_bits)),
            "total_bits": len(input_bits),
            "original_bits": original_str,
            "received_bits": received_str,
            "reconstructed_text": None,
        }

        if self.payload.source_type == "text":
            result["reconstructed_text"] = DataConverter.bits_to_text(received_bits)

        return result

    def execute(self) -> Dict[str, Any]:
        input_bits = self._prepare_source_bits()
        modulator = self._build_modulator()
        noise_cascade = self._build_noise_cascade()

        enabled_equalizers = {
            cfg.noise_type.lower() for cfg in self.payload.noises if cfg.equalize
        }

        pipeline = PipelineManager(modulator, noise_cascade, enabled_equalizers)
        received_bits, ber = pipeline.run(input_bits)

        return self._format_result(input_bits, received_bits, ber)