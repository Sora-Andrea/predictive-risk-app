from pathlib import Path
from typing import Dict, Any, Optional

import joblib
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
# model produced by train_diabetes.py, serialized using joblib
MODEL_PATH = BASE_DIR / "models" / "diabetes_model.joblib"
_FEATURES = ["Gender", "Age", "BMI", "Chol", "TG", "HDL", "LDL", "Cr", "BUN"]
# Cache model 
_model = None

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


def _load():
    # load once, reuse)
    global _model
    if _model is None:
        _model = joblib.load(MODEL_PATH)


def _normalize_gender(value: Optional[Any]) -> Optional[str]:
    # Convert gender into value the model expects
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    key = str(value).strip().lower()
    if not key or key in {"nan", "none"}:
        return None
    return _GENDER_MAP.get(key, key)


def _coerce_float(value: Optional[Any]) -> Optional[float]:
    # Parse for numeric inputs coming in
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def predict_diabetes_prob(payload: Dict[str, Any]) -> float:
    # Dataframe (in feature order)
    _load()
    row = {
        "Gender": _normalize_gender(payload.get("sex")),
        "Age": _coerce_float(payload.get("age")),
        "BMI": _coerce_float(payload.get("bmi")),
        "Chol": _coerce_float(payload.get("total_cholesterol")),
        "TG": _coerce_float(payload.get("triglycerides")),
        "HDL": _coerce_float(payload.get("hdl")),
        "LDL": _coerce_float(payload.get("ldl")),
        "Cr": _coerce_float(payload.get("creatinine")),
        "BUN": _coerce_float(payload.get("bun")),
    }
    X = pd.DataFrame([row], columns=_FEATURES)
    return float(_model.predict_proba(X)[0, 1])
