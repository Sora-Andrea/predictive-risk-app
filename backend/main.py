from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict, Optional
import csv
from functools import lru_cache
from pathlib import Path

from ocr_pipeline import process_image_bytes, process_pdf_bytes
from ml.diabetes_infer import predict_diabetes_prob


class DiabetesRiskPayload(BaseModel):
    sex: Optional[str] = None
    age: Optional[float] = None
    bmi: Optional[float] = None
    total_cholesterol: Optional[float] = None
    triglycerides: Optional[float] = None
    hdl: Optional[float] = None
    ldl: Optional[float] = None
    creatinine: Optional[float] = None
    bun: Optional[float] = None


class PredictRequest(BaseModel):
    systolic_bp: float
    smoker: bool

class PredictResponse(BaseModel):
    risk_score: float
    risk_level: str


app = FastAPI(title="Predictive Risk API", version="0.0.2")
DIABETES_MODEL_VERSION = "Logistic regression diabetes classifier"
DATA_DIR = Path(__file__).resolve().parent / "ml" / "data"
REFERENCE_FILES = {
    "male": DATA_DIR / "reference_ranges_male.csv",
    "female": DATA_DIR / "reference_ranges_female.csv",
}
_GENDER_MAP = {
    "m": "male",
    "male": "male",
    "man": "male",
    "1": "male",
    "f": "female",
    "female": "female",
    "woman": "female",
    "0": "female",
}
BIOMARKER_FIELDS = (
    "total_cholesterol",
    "triglycerides",
    "hdl",
    "ldl",
    "creatinine",
    "bun",
)


def _parse_float(value: Any) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _normalize_sex(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    key = str(value).strip().lower()
    if not key or key in {"nan", "none"}:
        return None
    return _GENDER_MAP.get(key, key)


@lru_cache(maxsize=2)
def _load_reference_ranges(sex: str) -> Dict[str, Dict[str, Optional[float | str]]]:
    target = "female" if sex == "female" else "male"
    path = REFERENCE_FILES[target]
    ranges: Dict[str, Dict[str, Optional[float | str]]] = {}
    if not path.exists():
        return ranges
    with path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            biomarker = (row.get("biomarker") or "").strip()
            if not biomarker:
                continue
            low = _parse_float(row.get("low"))
            high = _parse_float(row.get("high"))
            unit = (row.get("unit") or "").strip() or None
            ranges[biomarker] = {"low": low, "high": high, "unit": unit}
    return ranges


def _classify_status(value: Optional[float], low: Optional[float], high: Optional[float]) -> str:
    if value is None:
        return "unknown"
    if low is not None and value < low:
        return "low"
    if high is not None and value > high:
        return "high"
    return "normal"


def _summarize_biomarkers(payload: Dict[str, Any], sex: Optional[str]) -> Dict[str, Dict[str, Any]]:
    normalized_sex = _normalize_sex(sex) or "male"
    ranges = _load_reference_ranges(normalized_sex)
    summary: Dict[str, Dict[str, Any]] = {}
    for field in BIOMARKER_FIELDS:
        value = _parse_float(payload.get(field))
        range_info = ranges.get(field)
        if value is None and range_info is None:
            continue
        low = range_info.get("low") if range_info else None
        high = range_info.get("high") if range_info else None
        unit = range_info.get("unit") if range_info else None
        summary[field] = {
            "value": value,
            "low": low,
            "high": high,
            "unit": unit,
            "status": _classify_status(value, low, high),
        }
    return summary

# Expo web on localhost)
origins = [
    "http://localhost", # http://localhost:8081/
    "http://127.0.0.1", # http://127.0.0.1:8000/health
    "http://localhost:19006",  # Expo
    "http://127.0.0.1:19006"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/predict_diabetes")
def predict_diabetes(req: DiabetesRiskPayload):
    try:
        payload = req.model_dump()
        prob = predict_diabetes_prob(payload)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=f"Model not available: {exc}") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc
    return {
        "diabetes_prob": round(prob, 4),
        "model_version": DIABETES_MODEL_VERSION,
        "biomarker_summary": _summarize_biomarkers(payload, req.sex),
        "normalized_sex": _normalize_sex(req.sex),
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/ingest")
async def ingest(file: UploadFile = File(...)):
    # Validate content type
    allowed = {"image/jpeg", "image/png", "application/pdf"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, or PDF files are allowed.")

    content = await file.read()

    if file.content_type == "application/pdf":
        # Render PDF pages at higher DPI and OCR each page
        try:
            out = process_pdf_bytes(content, dpi=400)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"PDF parse error: {e}")

        return {
            "fields": out["fields"],
            "meta": out["meta"],
            "raw_text": out["raw_text"],
        }

    else:
        # JPEG or PNG
        try:
            out = process_image_bytes(content)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Image parse error: {e}")

        return {
            "fields": out["fields"],
            "meta": out["meta"],
            "raw_text": out["raw_text"],
        }
