import io
import re
import os
from typing import Dict, Tuple, Optional

import cv2
import numpy as np
from PIL import Image, ImageOps
import pytesseract
from pdf2image import convert_from_bytes
from pdf2image.exceptions import PDFInfoNotInstalledError

os.environ["POPPLER_PATH"] = r"C:\Program Files\Poppler\poppler-25.07.0\Library\bin"

# General printed text: one block, keep spaces, give DPI hint.
TESS_CFG_BLOCK = "--oem 3 --psm 6 -c preserve_interword_spaces=1 -c user_defined_dpi=300"
# Numeric single-line
TESS_CFG_NUM = "--oem 3 --psm 7 -c user_defined_dpi=300 -c tessedit_char_whitelist=0123456789./mgdL%"

# ALIASES (lowercased, punctuation-insensitive)
ALIASES = {
    # ALIASES for: Lipid panel
    "total_cholesterol": [
        "total cholesterol", "cholesterol total", "chol total", "chol, total", "tc",
    ],
    "hdl": ["hdl", "hdl cholesterol", "hdl-cholesterol", "hdl-c", "hdl c"],
    "ldl": [
        "ldl", "ldl cholesterol", "ldl-cholesterol", "ldl-c", "ldl c",
        "ldl calc", "ldl-chol calc", "ldl cholesterol calc", "ldl calculated",
    ],
    "triglycerides": ["triglycerides", "trig", "tg", "triglyc"],
    "non_hdl": ["non-hdl", "non hdl", "nonhdl"],
    "chol_hdl_ratio": ["chol:hdl ratio", "chol/hdl ratio", "tc/hdl ratio", "chol to hdl ratio"],

    # ALIASES for: CMP
    "glucose": ["glucose", "fasting glucose", "fpg"],
    "bun": ["bun", "blood urea nitrogen"],
    "creatinine": ["creatinine"],
    "sodium": ["sodium", "na"],
    "potassium": ["potassium", "k"],
    "chloride": ["chloride", "cl"],
    "bicarbonate": ["bicarbonate", "co2", "carbon dioxide"],
    "calcium": ["calcium", "ca"],
    "albumin": ["albumin"],
    "total_protein": ["total protein", "protein total"],

    # ALIASES for: Liver panel
    "alt": ["alt", "alanine aminotransferase", "alanine transaminase"],
    "ast": ["ast", "aspartate aminotransferase", "aspartate transaminase"],
    "alp": ["alp", "alkaline phosphatase"],
    "bilirubin": ["bilirubin", "total bilirubin", "tbili"],

    # ALIASES for: CBC
    "wbc": ["wbc", "white blood cells", "leukocytes"],
    "rbc": ["rbc", "red blood cells"],
    "hgb": ["hgb", "hemoglobin"],
    "hct": ["hct", "hematocrit"],
    "mcv": ["mcv"],
    "rdw": ["rdw", "rdw-cv"],
    "plt": ["plt", "platelets"],
    "mpv": ["mpv"],
    "neut": ["neut", "neutrophils"],
    "lymph": ["lymph", "lymphocytes"],
    "mono": ["mono", "monocytes"],
    "eos": ["eos", "eosinophils"],
    "baso": ["baso", "basophils"],

    # ALIASES for: Inflammation
    "crp": ["crp", "hs-crp", "c-reactive protein"],
}

# Unit conversion
# mmol/L to mg/dL
CONVERSIONS_MMolL_to_MgDL = {
    "glucose": 18.0182,
    "triglycerides": 88.57,
    #applies to total/hdl/ldl
    "cholesterol": 38.67,
}

def _to_mgdl(name: str, value: float, unit: str | None) -> float:
    if unit is None or re.search(r"mg/?dl", unit, re.I):
        return value
    if re.search(r"mmol/?l", unit, re.I):
        if name in ("total_cholesterol", "hdl", "ldl"):
            return round(value * CONVERSIONS_MMolL_to_MgDL["cholesterol"], 2)
        if name == "triglycerides":
            return round(value * CONVERSIONS_MMolL_to_MgDL["triglycerides"], 2)
        if name == "glucose":
            return round(value * CONVERSIONS_MMolL_to_MgDL["glucose"], 2)
    return value

# Preprocessing
def _ensure_min_height(gray: np.ndarray, min_h: int = 1500) -> np.ndarray:
    """Upscale small images to help OCR (acts as DPI proxy)."""
    h, w = gray.shape[:2]
    if h < min_h:
        scale = float(min_h) / float(h)
        gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    return gray

def _illumination_correction(gray: np.ndarray) -> np.ndarray:
    # Removes background
    bg = cv2.GaussianBlur(gray, (0, 0), sigmaX=25, sigmaY=25)
    norm = cv2.divide(gray, bg, scale=255)
    return norm

def _clahe(gray: np.ndarray) -> np.ndarray:
    # Contrast enhancement
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(gray)

def _denoise(gray: np.ndarray) -> np.ndarray:
    # Denoising that preserves punctuation and edges
    return cv2.bilateralFilter(gray, d=5, sigmaColor=50, sigmaSpace=50)

def _adaptive_binarize(gray: np.ndarray) -> np.ndarray:
    # Threshold
    return cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31, 15
    )

def preprocess_pil(pil_img: Image.Image) -> np.ndarray:
    # NumPy image ready for OCR
    gray = np.array(pil_img.convert("L"))
    gray = _ensure_min_height(gray, min_h=1500)
    norm = _illumination_correction(gray)
    norm = _clahe(norm)
    den = _denoise(norm)
    bin_img = _adaptive_binarize(den)
    return bin_img

#  OCR helper for lab report
def ocr_to_text(img_bin: np.ndarray) -> str:
    return pytesseract.image_to_string(img_bin, lang="eng", config=TESS_CFG_BLOCK)

# Parsing
VALUE = r"(?P<val>\d+(?:\.\d+)?)"
UNIT = r"(?P<unit>mg\/?dL|mmol\/?L)"
# tolerate "HDL: 45", "HDL 45", "HDL - 45"
SEP = r"(?:\s*[:=\-]?\s*)"

def _alias_to_pattern(alias: str) -> str:
    # find the word "chol" followed by the word "total"
    # "chol, total" -> r"\bchol\W*total\b"
    parts = re.split(r"\s+", alias.strip().lower())
    return r"\b" + r"\W*".join(map(re.escape, parts)) + r"\b"

def _build_compiled_patterns() -> Dict[str, re.Pattern]:
    pats = {}
    for canonical, variants in ALIASES.items():
        name_pat = r"(?:%s)" % "|".join(_alias_to_pattern(a) for a in variants)
        # Allow the value to appear anywhere to the right on the same line, since reports are often tables
        pattern = rf"{name_pat}.*?(?:{VALUE})?\s*(?:{UNIT})?"
        pats[canonical] = re.compile(pattern, flags=re.IGNORECASE)
    return pats

PATTERNS = _build_compiled_patterns()

_RANGE_RX = re.compile(r"\b\d+(?:\.\d+)?\s*(?:-|–|to|~)\s*\d+(?:\.\d+)?\b", re.I)
_NUMBER_RX = re.compile(r"(?P<val>\d+(?:\.\d+)?)")
_UNIT_RX = re.compile(r"\b(mg\/?dL|mmol\/?L)\b", re.I)
_HEADER_HINT_RX = re.compile(r"\b(reference|ref\.?|range|flag|units?)\b", re.I)


def _is_range_context(s: str) -> bool:
    return bool(_RANGE_RX.search(s))


def _extract_value_unit_from_line(s: str) -> Tuple[Optional[float], Optional[str]]:
    # Find the first standalone numeric value (not part of a range)
    for m in _NUMBER_RX.finditer(s):
        val_txt = m.group("val")
        # Look at a small window around the number to check for ranges
        start, end = m.span()
        window = s[max(0, start - 6): min(len(s), end + 6)]
        if _RANGE_RX.search(window):
            continue
        try:
            val = float(val_txt)
        except Exception:
            continue
        # Find a unit to the right if present
        unit_match = _UNIT_RX.search(s[end: end + 20])
        unit = unit_match.group(0) if unit_match else None
        return val, unit
    return None, None


def _parse_lines(text: str) -> Dict[str, Tuple[float, str | None]]:
    
    # First pass: scan line-by-line with robust alias patterns.
    # Returns: cannon value, cannon (unit | None)
    
    out: Dict[str, Tuple[float, str | None]] = {}
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    for i, ln in enumerate(lines):
        for canonical, rx in PATTERNS.items():
            if canonical in out:
                continue
            m = rx.search(ln)
            if not m:
                continue
            # Prefer value on the same line (anywhere to the right)
            same_line_slice = ln[m.end():]
            val, unit = _extract_value_unit_from_line(same_line_slice)
            if val is None:
                # Look ahead 1-2 lines for the value (OCR of tables)
                for j in range(1, 3):
                    if i + j >= len(lines):
                        break
                    nxt = lines[i + j]
                    # If next line looks like a header, keep scanning but avoid range tokens
                    v2, u2 = _extract_value_unit_from_line(nxt)
                    if v2 is not None:
                        val, unit = v2, u2
                        break
            if val is not None:
                out[canonical] = (val, unit)
    return out

def _normalize_units(parsed: Dict[str, Tuple[float, str | None]]) -> Dict[str, float]:
    out: Dict[str, float] = {}
    for name, (val, unit) in parsed.items():
        out[name] = _to_mgdl(name, val, unit)
    return out

def parse_labs(text: str) -> Dict[str, float]:
    # Text -> cannonical numeric fields (mg/dL where applicable)
    parsed = _parse_lines(text)
    norm = _normalize_units(parsed)
    # Derived metric biomarkers if available
    if "total_cholesterol" in norm and "hdl" in norm and "non_hdl" not in norm:
        tc = norm["total_cholesterol"]
        h = norm["hdl"]
        if isinstance(tc, (int, float)) and isinstance(h, (int, float)):
            if h is not None and tc is not None:
                norm["non_hdl"] = max(0.0, round(tc - h, 2))
                if h > 0:
                    norm["chol_hdl_ratio"] = round(tc / h, 2)
    return norm

# API
def process_image_bytes(b: bytes) -> Dict:
    
    # Accepts JPEG/PNG. Returns: dict(fields={}, raw_text=str, meta={...})

    pil = Image.open(io.BytesIO(b))
    try:
        # Correcting photo orientation using the EXIF rotation metadata (mobile bug fix)
        pil = ImageOps.exif_transpose(pil)
    except Exception:
        # Ignore rotation error metadata issues; fallbacks to original orientation
        pass
    pre = preprocess_pil(pil)
    text = ocr_to_text(pre)
    fields = parse_labs(text)
    return {
        "fields": fields,
        "raw_text": text,
        "meta": {"pages": 1, "source": "image"}
    }

def process_pdf_bytes(pdf_b: bytes, dpi: int = 400) -> Dict:
    poppler_path = os.getenv("POPPLER_PATH") or os.getenv("POPPLER_BIN")
    try:
        if poppler_path:
            pages = convert_from_bytes(pdf_b, fmt="png", dpi=dpi, poppler_path=poppler_path)
        else:
            pages = convert_from_bytes(pdf_b, fmt="png", dpi=dpi)
    except PDFInfoNotInstalledError as exc:
        raise RuntimeError(
            "pdf2image: Poppler is required to process PDFs -> https://www.geeksforgeeks.org/python/convert-pdf-to-image-using-python/#"
        ) from exc
    
    # Accepts PDF bytes. Renders each page to image, runs the same pipeline.
    # Returns merged fields (first wins) + raw text.
    merged: Dict[str, float] = {}
    texts = []

    for p in pages:
        buf = io.BytesIO()
        p.save(buf, format="PNG")
        part = process_image_bytes(buf.getvalue())
        texts.append(part["raw_text"])
        for k, v in part["fields"].items():
            if k not in merged and isinstance(v, (int, float)):
                merged[k] = v

    return {
        "fields": merged,
        "raw_text": ("\n\n-----\n\n".join(texts))[:5000],
        "meta": {"pages": len(pages), "source": "pdf", "dpi": dpi}
    }
