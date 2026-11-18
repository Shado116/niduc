from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pathlib import Path


from core.schemas import SimulationPayload
from core.simulation_service import SimulationService, get_capabilities

#TODO uv run uvicorn main:app --reload --port 8080



app = FastAPI(title="Modulation Simulator API")

BASE_DIR = Path(__file__).resolve().parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

@app.get("/")
async def get_wizard(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")

@app.post("/api/simulate")
async def run_simulation(payload: SimulationPayload):
    service = SimulationService(payload)
    return service.execute()


@app.get("/api/capabilities")
def capabilities():
    return get_capabilities()


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": f"Błąd serwera: {str(exc)}",
            "detail": str(exc),
        },
    )