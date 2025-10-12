import { create } from "zustand";

// Canonical OCR fields the backend may produce
// Keep optional; backend returns only what it finds.
export type Fields = {
  // Lipids
  total_cholesterol?: number;
  hdl?: number;
  ldl?: number;
  triglycerides?: number;
  non_hdl?: number;
  chol_hdl_ratio?: number;

  // CMP
  glucose?: number;
  bun?: number;
  creatinine?: number;
  sodium?: number;
  potassium?: number;
  chloride?: number;
  bicarbonate?: number;
  calcium?: number;
  albumin?: number;
  total_protein?: number;
  alt?: number;
  ast?: number;
  alp?: number;
  bilirubin?: number;

  // CBC
  wbc?: number;
  rbc?: number;
  hgb?: number;
  hct?: number;
  mcv?: number;
  rdw?: number;
  plt?: number;
  mpv?: number;
  neut?: number;
  lymph?: number;
  mono?: number;
  eos?: number;
  baso?: number;

  // Inflammation
  crp?: number;
};

type OcrState = {
  fields: Fields;
  setFields: (f: Fields) => void;
  clear: () => void;
};

export const useOcrStore = create<OcrState>((set) => ({
  fields: {},
  setFields: (f) => set({ fields: f }),
  clear: () => set({ fields: {} }),
}));
