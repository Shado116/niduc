import importlib
import pkgutil
from typing import Dict, Type
from .base import NoiseStrategy

NOISE_PRIORITY: Dict[str, int] = {
    "IQPhaseImbalance": 10,
    "Rayleigh": 20,
    "FrequencyOffset": 30,
    "PhaseNoise": 40,
    "AWGN": 50,
}

_raw_channels: Dict[str, Type[NoiseStrategy]] = {}

for _, module_name, _ in pkgutil.iter_modules(__path__):
    if module_name == "base":
        continue

    module = importlib.import_module(f"{__name__}.{module_name}")

    for attr_name in dir(module):
        attr = getattr(module, attr_name)

        if isinstance(attr, type) and attr_name.endswith("Channel"):
            key = attr_name.replace("Channel", "")
            _raw_channels[key] = attr

AVAILABLE_CHANNELS: Dict[str, Type[NoiseStrategy]] = dict(
    sorted(
        _raw_channels.items(),
        key=lambda item: NOISE_PRIORITY.get(item[0], 999)
    )
)

__all__ = ["NoiseStrategy", "AVAILABLE_CHANNELS", "NOISE_PRIORITY"]

print(f"{100*'-'}\nAvailable noise strategies (physical sequence):\n")
for i in AVAILABLE_CHANNELS:
    print(f">>\t{i}")
print()