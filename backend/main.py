from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

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
        prob = predict_diabetes_prob(req.model_dump())
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=f"Model not available: {exc}") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc
    return {"diabetes_prob": round(prob, 4), "model_version": DIABETES_MODEL_VERSION}


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
