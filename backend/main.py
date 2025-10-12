from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from ocr_pipeline import process_image_bytes, process_pdf_bytes

class PredictRequest(BaseModel):
    age: int
    sex: str
    total_cholesterol: float
    hdl: float
    systolic_bp: float
    smoker: bool

class PredictResponse(BaseModel):
    risk_score: float
    risk_level: str

app = FastAPI(title="Predictive Risk API", version="0.0.1")

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

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    # Replace with a trained model later.
    base = 0.05
    base += (req.total_cholesterol - 180.0) * 0.0008
    base += (req.systolic_bp - 120.0) * 0.001
    base += - (req.hdl - 50.0) * 0.002
    if req.smoker:
        base += 0.06
    if req.sex.lower() == "male":
        base += 0.02
    if req.age > 50:
        base += 0.03

    risk = max(0.0, min(1.0, base))
    concern_level = "low"
    if risk >= 0.20:
        concern_level = "high"
    elif risk >= 0.10:
        concern_level = "moderate"

    return PredictResponse(risk_score=round(risk, 3), risk_level=concern_level)

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