import os
from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, classification_report

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "Diabetes Classification.csv"
OUT_DIR = BASE_DIR / "models"
OUT_PATH = OUT_DIR / "diabetes_model.joblib"

# features (that exist)
NUMERIC = ["Age","BMI","Chol","TG","HDL","LDL","Cr","BUN"]
CATEGORICAL = ["Gender"]
ALL_FEATURES = CATEGORICAL + NUMERIC
LABEL = "Diagnosis"

# gender codes to strings
GENDER_MAP = {
    "m": "male",
    "male": "male",
    "1": "male",
    "f": "female",
    "female": "female",
    "0": "female",
}

def load_data(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path, index_col=0)
    df.columns = df.columns.str.strip()

    if LABEL not in df.columns:
        raise ValueError(f"Label column '{LABEL}' not found.")

    gender_norm = (
        df["Gender"]
        .astype(str)
        .str.strip()
        .str.lower()
        .map(GENDER_MAP)
    )
    df["Gender"] = gender_norm.fillna(df["Gender"].astype(str).str.strip().str.lower())
    # Ensuring the label column is numeric
    df[LABEL] = df[LABEL].astype(int)
    return df

def make_pipeline():
    # Numeric columns
    num_pipe = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])
    # Categorical columns
    cat_pipe = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore")),
    ])
    pre = ColumnTransformer(
        transformers=[
            ("cat", cat_pipe, CATEGORICAL),
            ("num", num_pipe, NUMERIC),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )
    # Logistic regression classifier
    clf = LogisticRegression(max_iter=300, class_weight="balanced")
    pipe = Pipeline(steps=[("preproc", pre), ("clf", clf)])
    return pipe

def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    # Load data
    df = load_data(DATA_PATH)

    X = df[ALL_FEATURES].copy()
    y = df[LABEL].copy()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pipe = make_pipeline()
    pipe.fit(X_train, y_train)

    # Evaluate
    try:
        proba = pipe.predict_proba(X_test)[:, 1]
        auc = roc_auc_score(y_test, proba)
    except Exception:
        auc = float("nan")
        proba = None

    print(f"Validation AUC: {auc:.3f}")
    preds = pipe.predict(X_test)
    print(classification_report(y_test, preds, digits=3))

    joblib.dump(pipe, OUT_PATH)
    print(f"Saved model to {OUT_PATH}")

if __name__ == "__main__":
    main()
