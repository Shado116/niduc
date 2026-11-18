import importlib
import pkgutil
from .base import ModulationStrategy

AVAILABLE_MODULATORS: dict[str, type] = {}

for _, module_name, _ in pkgutil.iter_modules(__path__):
    if module_name == "base":
        continue

    module = importlib.import_module(f"{__name__}.{module_name}")

    for attr_name in dir(module):
        attr = getattr(module, attr_name)

        if isinstance(attr, type) and attr_name.endswith("Modulation"):
            key = attr_name.replace("Modulation", "")
            if key == "PSK8":
                key = "8PSK"
            AVAILABLE_MODULATORS[key] = attr

__all__ = ["ModulationStrategy", "AVAILABLE_MODULATORS"]

print(f"{100*'-'}\nAvailable modulation strategies:\n")
for i in AVAILABLE_MODULATORS:
    print(f">>\t{i}")
print()