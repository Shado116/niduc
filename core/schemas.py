from pydantic import BaseModel, Field
from typing import List, Optional

class NoiseConfig(BaseModel):
    noise_type: str
    param_value: float
    seed: Optional[int] = None
    equalize: bool = True

class SimulationPayload(BaseModel):
    source_type: str
    source_content: str
    source_seed: Optional[int] = None
    modulation: str
    noises: List[NoiseConfig] = Field(default_factory=list, description="Kaskada szumów")