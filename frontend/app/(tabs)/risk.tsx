import React, { useState, useEffect, useMemo, useRef } from "react";
import { Platform, StyleSheet, View, TextInput, Pressable } from "react-native";
import { Image } from "expo-image";
import axios from "axios";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { Fonts } from "@/constants/theme";
import { ThemedView } from "@/components/themed-view";
import type Animated from "react-native-reanimated";
import ScreenTransitionView from "@/components/ScreenTransitionView";
import { API_URL } from "@/src/config";
import { Ionicons } from "@expo/vector-icons";
import { useOcrStore } from "@/src/store/useOcrStore";
import BiomarkerIndicator, { BiomarkerIndicatorDatum } from "@/components/biomarker-indicator";

// Fields
type FieldProps = {
  label: string;
  abbr?: string;
  value: string;
  onChangeText: (t: string) => void;
  inputMode?: "text" | "numeric" | "decimal";
  placeholder?: string;
  help?: string;
  defaultOpen?: boolean; 
};

type BiomarkerStatus = {
  value: number | null;
  low: number | null;
  high: number | null;
  unit?: string | null;
  status: "low" | "normal" | "high" | "unknown";
};

type DiabetesResult = {
  diabetes_prob: number;
  model_version: string;
  biomarker_summary?: Record<string, BiomarkerStatus>;
  normalized_sex?: string | null;
};

const BIOMARKER_ORDER = [
  "total_cholesterol",
  "triglycerides",
  "hdl",
  "ldl",
  "creatinine",
  "bun",
] as const;

const BIOMARKER_LABELS: Record<(typeof BIOMARKER_ORDER)[number], string> = {
  total_cholesterol: "Total Cholesterol",
  triglycerides: "Triglycerides",
  hdl: "HDL Cholesterol",
  ldl: "LDL Cholesterol",
  creatinine: "Creatinine",
  bun: "Blood Urea Nitrogen",
};

const SEVERITY_COLORS: Record<string, string> = {
  high: "#c62828",
  moderate: "#f9a825",
  low: "#2e7d32",
};

const SEVERITY_LABELS: Record<string, string> = {
  high: "High",
  moderate: "Moderate",
  low: "Low",
  unknown: "Unknown",
};

const Field = React.memo(function Field({
  label,
  value,
  onChangeText,
  inputMode = "decimal",
  placeholder,
  help,
  defaultOpen = false,
}: FieldProps) {
  const [open, setOpen] = useState(defaultOpen);
  const isNumericLike = inputMode === "numeric" || inputMode === "decimal";

  const handleChangeText = (text: string) => {
    if (!isNumericLike) {
      onChangeText(text);
      return;
    }
    let sanitized = text.replace(/[^0-9.]/g, "");
    if (inputMode === "numeric") {
      sanitized = sanitized.replace(/\./g, "");
    } else if (inputMode === "decimal") {
      const firstDot = sanitized.indexOf(".");
      if (firstDot !== -1) {
        sanitized =
          sanitized.slice(0, firstDot + 1) +
          sanitized
            .slice(firstDot + 1)
            .replace(/\./g, "");
      }
    }
    onChangeText(sanitized);
  };

  const keyboardType =
    inputMode === "numeric"
      ? "number-pad"
      : inputMode === "decimal"
      ? "decimal-pad"
      : "default";

  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
        <ThemedText type="defaultSemiBold" style={{ flex: 1 }}>
          {label}
        </ThemedText>

        {help ? (
          <Pressable
            onPress={() => setOpen((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={open ? "Hide info" : "Show info"}
            hitSlop={8}
            style={{ paddingHorizontal: 4, paddingVertical: 2 }}
          >
          
          <Ionicons
            name={open ? "information-circle" : "information-circle-outline"}
            size={18}
            color="#6b7280"
          />
        </Pressable>
      ) : null}
    </View>

      {/* Collapsible help panel */}
      {help && open ? (
        <ThemedView
          style={{
            marginBottom: 6,
            padding: 8,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            backgroundColor: "transparent",
          }}
        >
          <ThemedText style={{ fontSize: 12, opacity: 0.8, lineHeight: 16 }}>
            {help}
          </ThemedText>
        </ThemedView>
      ) : null}

      {/* Text input */}
      <TextInput
        value={value}
        onChangeText={handleChangeText}
        inputMode={inputMode || "text"}
        keyboardType={keyboardType}
        autoCorrect={false}
        autoCapitalize="none"
        placeholder={placeholder}
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 10,
          backgroundColor: "white",
        }}
      />
    </View>
  );
});


/* Sections */
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <ThemedView
      style={{
        padding: 16,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "#e5e7eb",
        marginBottom: 16,
      }}
    >
      <ThemedText type="subtitle" style={{ marginBottom: 4 }}>
        {title}
      </ThemedText>
      {description ? (
        <ThemedText style={{ marginBottom: 10, opacity: 0.8 }}>{description}</ThemedText>
      ) : null}
      {children}
    </ThemedView>
  );
}

export default function ExploreScreen() {
 
  const scrollRef = useRef<Animated.ScrollView | null>(null);
  const ocr = useOcrStore((s) => s.fields);
  useEffect(() => {
    console.log("Risk received OCR fields:", ocr);
  }, [ocr]);
 
  const isMobile = Platform.OS === "android" || Platform.OS === "ios";
 
  /* Demographic and Vitals */
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [bmi, setBmi] = useState("");
  //blood pressure: The first number in a reading
  // const [systolicBp, setSystolicBp] = useState("");
  // const [smoker, setSmoker] = useState("");
  
  /* Lipids */
  const [totalCholesterol, setTotalCholesterol] = useState("");
  const [hdl, setHdl] = useState("");
  const [ldl, setLdl] = useState("");
  const [triglycerides, setTriglycerides] = useState("");
  const [nonHdl, setNonHdl] = useState("");
  const [cholHdlRatio, setCholHdlRatio] = useState("");

  /* Complete Blood Count CBC */
  // White Blood Cell count
  const [wbc, setWbc] = useState("");
  // Red Blood Cell count
  const [rbc, setRbc] = useState("");
  // Hemoglobin
  const [hgb, setHgb] = useState("");
  // Hematocrit
  const [hct, setHct] = useState("");
  // Mean Corpuscular Volume
  const [mcv, setMcv] = useState("");
  // Red Cell Distribution Width
  const [rdw, setRdw] = useState("");
  // Platelet count
  const [plt, setPlt] = useState("");
  // Mean Platelet Volume
  const [mpv, setMpv] = useState("");
  // WBC Differential
  const [neut, setNeut] = useState("");
  const [lymph, setLymph] = useState("");
  const [mono, setMono] = useState("");
  const [eos, setEos] = useState("");
  const [baso, setBaso] = useState("");

  /* CMP */
  const [glucose, setGlucose] = useState(
    ocr.glucose != null ? String(ocr.glucose) : ""
  );
  const [bun, setBun] = useState("");
  const [creatinine, setCreatinine] = useState("");
  const [albumin, setAlbumin] = useState("");
  const [totalProtein, setTotalProtein] = useState("");
  const [sodium, setSodium] = useState("");
  const [potassium, setPotassium] = useState("");
  const [chloride, setChloride] = useState("");
  const [bicarbonate, setBicarbonate] = useState("");
  const [alt, setAlt] = useState("");
  const [ast, setAst] = useState("");
  const [alp, setAlp] = useState("");
  const [bilirubin, setBilirubin] = useState("");
  const [calcium, setCalcium] = useState("");

  /* Inflammation Marker */
  const [crp, setCrp] = useState("");
  
  /* OCR -> populate fields */
  useEffect(() => {
    if (ocr.bmi != null) setBmi(String(ocr.bmi));
    // Lipids
    if (ocr.total_cholesterol != null) setTotalCholesterol(String(ocr.total_cholesterol));
    if (ocr.hdl != null) setHdl(String(ocr.hdl));
    if (ocr.ldl != null) setLdl(String(ocr.ldl));
    if (ocr.triglycerides != null) setTriglycerides(String(ocr.triglycerides));
    if (ocr.non_hdl != null) setNonHdl(String(ocr.non_hdl));
    if (ocr.chol_hdl_ratio != null) setCholHdlRatio(String(ocr.chol_hdl_ratio));

    // CMP
    if (ocr.glucose != null) setGlucose(String(ocr.glucose));
    if (ocr.bun != null) setBun(String(ocr.bun));
    if (ocr.creatinine != null) setCreatinine(String(ocr.creatinine));
    if (ocr.albumin != null) setAlbumin(String(ocr.albumin));
    if (ocr.total_protein != null) setTotalProtein(String(ocr.total_protein));
    if (ocr.sodium != null) setSodium(String(ocr.sodium));
    if (ocr.potassium != null) setPotassium(String(ocr.potassium));
    if (ocr.chloride != null) setChloride(String(ocr.chloride));
    if (ocr.bicarbonate != null) setBicarbonate(String(ocr.bicarbonate));
    if (ocr.alt != null) setAlt(String(ocr.alt));
    if (ocr.ast != null) setAst(String(ocr.ast));
    if (ocr.alp != null) setAlp(String(ocr.alp));
    if (ocr.bilirubin != null) setBilirubin(String(ocr.bilirubin));
    if (ocr.calcium != null) setCalcium(String(ocr.calcium));

    // CBC
    if (ocr.wbc != null) setWbc(String(ocr.wbc));
    if (ocr.rbc != null) setRbc(String(ocr.rbc));
    if (ocr.hgb != null) setHgb(String(ocr.hgb));
    if (ocr.hct != null) setHct(String(ocr.hct));
    if (ocr.mcv != null) setMcv(String(ocr.mcv));
    if (ocr.rdw != null) setRdw(String(ocr.rdw));
    if (ocr.plt != null) setPlt(String(ocr.plt));
    if (ocr.mpv != null) setMpv(String(ocr.mpv));
    if (ocr.neut != null) setNeut(String(ocr.neut));
    if (ocr.lymph != null) setLymph(String(ocr.lymph));
    if (ocr.mono != null) setMono(String(ocr.mono));
    if (ocr.eos != null) setEos(String(ocr.eos));
    if (ocr.baso != null) setBaso(String(ocr.baso));

    // Inflammation
    if (ocr.crp != null) setCrp(String(ocr.crp));
  }, [ocr]);
  
  // Get Non-HDL and Chol/HDL ratio (better for calculating risk)
  useEffect(() => {
    // non-HDL = Total Chol - HDL 
    const tc = parseFloat(totalCholesterol);
    const h = parseFloat(hdl);
    if (!isNaN(tc) && !isNaN(h)) setNonHdl(String(Math.max(0, tc - h)));
    // Chol/HDL ratio
    if (!isNaN(tc) && !isNaN(h) && h > 0) setCholHdlRatio((tc / h).toFixed(2));
  }, [totalCholesterol, hdl]);
  
  
  // Prediction Button
  const [result, setResult] = useState<DiabetesResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const demographicsComplete = age.trim().length > 0 && sex.trim().length > 0;
  const submitDisabled = loading || !demographicsComplete;

  useEffect(() => {
    if (!result && !error) {
      return;
    }
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 120);
    return () => clearTimeout(timeout);
  }, [result, error]);
 
  const submit = async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
    try {
      const payload: Record<string, unknown> = {};
      const addNumber = (key: string, value: string) => {
        const num = parseFloat(value);
        if (!Number.isNaN(num)) {
          payload[key] = num;
        }
      };

      const normalizedSex = sex.trim().toLowerCase();
      if (normalizedSex) payload.sex = normalizedSex;

      addNumber("age", age);
      addNumber("bmi", bmi);
      addNumber("total_cholesterol", totalCholesterol);
      addNumber("triglycerides", triglycerides);
      addNumber("hdl", hdl);
      addNumber("ldl", ldl);
      addNumber("creatinine", creatinine);
      addNumber("bun", bun);

      const res = await axios.post<DiabetesResult>(`${API_URL}/predict_diabetes`, payload);
      setResult(res.data);
    } catch (e: any) {
      console.log("Predict error:", e?.message);
      const detail = e?.response?.data?.detail;
      setError((typeof detail === "string" && detail) || e?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const diabetesProb = result?.diabetes_prob ?? 0;
  const diabetesPercent = Math.round(diabetesProb * 1000) / 10;
  const diabetesSeverity =
    diabetesProb >= 0.45 ? "high" : diabetesProb >= 0.25 ? "moderate" : diabetesProb > 0 ? "low" : "unknown";
  const severityColor = SEVERITY_COLORS[diabetesSeverity] || "#1976d2";
  const severityLabel = SEVERITY_LABELS[diabetesSeverity] || "Unknown";

  const biomarkerData = useMemo<BiomarkerIndicatorDatum[]>(() => {
    if (!result?.biomarker_summary) return [];
    return BIOMARKER_ORDER.map((key) => {
      const entry = result.biomarker_summary?.[key];
      const value = entry?.value;
      if (!entry || value === null || Number.isNaN(value)) return null;
      return {
        key,
        label: BIOMARKER_LABELS[key],
        low: entry.low ?? null,
        high: entry.high ?? null,
        value,
        unit: entry.unit ?? null,
        status: entry.status,
      } as BiomarkerIndicatorDatum;
    }).filter((item): item is BiomarkerIndicatorDatum => item !== null);
  }, [result]);

  const hasBiomarkerData = biomarkerData.length > 0;

  return (
    <ScreenTransitionView>
      <ParallaxScrollView
        ref={scrollRef}
        headerBackgroundGradient={{
          light: ['#356290', '#1784B2', '#509fc3ff', '#1784B2', '#356290'] as const,
          dark: ['#356290', '#1784B2', '#509fc3ff', '#1784B2', '#356290'] as const,
          locations: [0, 0.25, 0.5, 0.75, 1] as const,
        }}
        headerImage={
        <View
          style={[
            styles.headerImageContainer,
            !isMobile && styles.headerImageContainerWeb,
          ]}
        >
          <Image
            source={
              isMobile
                ? require("@/assets/images/placeholderLogoM.png")
                : require("@/assets/images/placeholderLogo.png")
            }
            contentFit="contain"
            contentPosition={isMobile ? "center" : "left center"}
            style={styles.placeholderLogo}
          />
        </View>
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{fontFamily: Fonts.rounded,}}>
          Calculate Diabetes Risk
        </ThemedText>
      </ThemedView>

      <ThemedText style={{ marginBottom: 16 }}>
        Please enter your health data below.{"\n"}Try to fill in all the fields for better accuracy.
      </ThemedText>

      {/* Demographics and Vitals */}
      <Section title="Demographics">
        <Field label="*Age" value={age} onChangeText={setAge} inputMode="numeric" placeholder="e.g., 45" />
        <Field label="*Sex (male/female)" value={sex} onChangeText={setSex} inputMode="text" placeholder="male or female" />
        <Field label="*Body Mass Index (BMI)" value={bmi} onChangeText={setBmi} inputMode="decimal" placeholder="e.g., 24.5" />
        {/* <Field label="Systolic BP (mmHg)" value={systolicBp} onChangeText={setSystolicBp} inputMode="decimal" placeholder="e.g., 130" /> */}
        {/* <Field label="Smoker (true/false)" value={smoker} onChangeText={setSmoker} inputMode="text" placeholder="true or false" /> */}
      </Section>

      {/* CBC 
      <Section
        title="Complete Blood Count (CBC)"
        description="A CBC provides detailed information about blood cells; results can hint at inflammation or nutritional deficiencies."
      >
        <Field label="White Blood Cell count (WBC)" help={"Measured in 10^3/uL\nLeukocyte count."} value={wbc} onChangeText={setWbc} />
        <Field label="Red Blood Cell count (RBC)" help="Measured in 10^6/uL." value={rbc} onChangeText={setRbc} />
        <Field label="Hemoglobin (Hgb)" help={"Measured in g/dL\nOxygen-carrying protein in red blood cells."} value={hgb} onChangeText={setHgb} />
        <Field label="Hematocrit (Hct)" help={"Measured in %\nPercent of blood volume occupied by RBCs."} value={hct} onChangeText={setHct} />
        <Field label="Mean Corpuscular Volume (MCV)" help={"Measured in fL\nAverage size of RBCs."} value={mcv} onChangeText={setMcv} />
        <Field label="Red Cell Distribution Width (RDW)" help={"Measured in %\nVariation in RBC size; sometimes RDW-CV."} value={rdw} onChangeText={setRdw} />
        <Field label="Platelet count (Plt)" help="Measured in 10^3/uL." value={plt} onChangeText={setPlt} />
        <Field label="Mean Platelet Volume (MPV)" help="Measured in fL." value={mpv} onChangeText={setMpv} />
        <Field label="Neutrophils (Neut)" help={"Measured in %\nWBC differential."} value={neut} onChangeText={setNeut} />
        <Field label="Lymphocytes (Lymph)" help="Measured in %." value={lymph} onChangeText={setLymph} />
        <Field label="Monocytes (Mono)" help="Measured in %." value={mono} onChangeText={setMono} />
        <Field label="Eosinophils (Eos)" help="Measured in %." value={eos} onChangeText={setEos} />
        <Field label="Basophils (Baso)" help="Measured in %." value={baso} onChangeText={setBaso} />
      </Section>*/}

      {/* CMP */}
      <Section
        title="Comprehensive Metabolic Panel (CMP)"
        description="Evaluates organ function and electrolytes; core for metabolic and cardiovascular risk."
      >
        {/*<Field label="Glucose" help={"Measured in mg/dL\nFasting glucose key for T2D risk."} value={glucose} onChangeText={setGlucose} />*/}
        <Field label="*Blood Urea Nitrogen (BUN)" help="Measured in mg/dL." value={bun} onChangeText={setBun} />
        <Field label="*Creatinine" help="Measured in mg/dL." value={creatinine} onChangeText={setCreatinine} />
        {/*<Field label="Albumin" help={"Measured in g/dL\nLow may indicate malnutrition or liver disease."} value={albumin} onChangeText={setAlbumin} />
        <Field label="Total Protein" help="Measured in g/dL." value={totalProtein} onChangeText={setTotalProtein} />
        <Field label="Sodium (Na)" help="Measured in mEq/L." value={sodium} onChangeText={setSodium} />
        <Field label="Potassium (K)" help="Measured in mEq/L." value={potassium} onChangeText={setPotassium} />
        <Field label="Chloride (Cl)" help="Measured in mEq/L." value={chloride} onChangeText={setChloride} />
        <Field label="Bicarbonate (CO2)" help="Measured in mEq/L." value={bicarbonate} onChangeText={setBicarbonate} />
        <Field label="Alanine Aminotransferase (ALT)" help={"Measured in U/L\nAlso Alanine Transaminase."} value={alt} onChangeText={setAlt} />
        <Field label="Aspartate Aminotransferase (AST)" help={"Measured in U/L\nAlso Aspartate Transaminase."} value={ast} onChangeText={setAst} />
        <Field label="Alkaline Phosphatase (ALP)" help="Measured in IU/L." value={alp} onChangeText={setAlp} />
        <Field label="Bilirubin" help={"Measured in mg/dL\nLiver-processed waste product."} value={bilirubin} onChangeText={setBilirubin} />
        <Field label="Calcium (Ca)" help="Measured in mg/dL." value={calcium} onChangeText={setCalcium} />*/}
      </Section>

      {/* Lipid Panel */}
      <Section
        title="Lipid Panel"
        description="Fats and fatty substances; core predictors for cardiovascular risk."
      >
        <Field label="*Total Cholesterol (TC)" help="Measured in mg/dL." value={totalCholesterol} onChangeText={setTotalCholesterol} />
        <Field label="*LDL Cholesterol (LDL-C)" help="Measured in mg/dL." value={ldl} onChangeText={setLdl} />
        <Field label="*HDL Cholesterol (HDL-C)" help="Measured in mg/dL." value={hdl} onChangeText={setHdl} />
        <Field label="*Triglycerides (TG)" help="Measured in mg/dL." value={triglycerides} onChangeText={setTriglycerides} />
        {/* <Field label="Non-HDL Cholesterol" help={"Measured in mg/dL\nCalculated: Total Chol (HDL)"} value={nonHdl} onChangeText={setNonHdl} /> */}
        {/* <Field label="Cholesterol : HDL Ratio" help="Measured as a ratio." value={cholHdlRatio} onChangeText={setCholHdlRatio} /> */}
      </Section>

      {/* Inflammation Marker 
      <Section
        title="Inflammation marker"
        description="high-sensitivity CRP links to heart disease risk."
      >
        <Field label="C-Reactive Protein (CRP)" help="Measured in mg/L." value={crp} onChangeText={setCrp} />
      </Section>*/}



      <ThemedView
        style={{
          padding: 8,
          borderRadius: 12,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: "Transparent",
        }}
      >
        {!demographicsComplete && (
          <ThemedText style={styles.demographicNotice}>
            Fill in demographic information before continuing
          </ThemedText>
        )}

        <Pressable
          onPress={submit}
          style={{
            backgroundColor: "#0891b2",
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: "center",
            opacity: submitDisabled ? 0.6 : 1,
          }}
          disabled={submitDisabled}
        >
          <ThemedText type="defaultSemiBold" style={{ color: "white" }}>
            {loading ? "Calculating..." : "Estimate Risk Probability"}
          </ThemedText>
        </Pressable>

        {error && <ThemedText style={{ marginTop: 10, color: "#c62828" }}>{error}</ThemedText>}

        {result && (
          <ThemedView style={styles.resultCard}>
            <ThemedText type="defaultSemiBold" style={{ marginBottom: 8 }}>
              Diabetes Prediction
            </ThemedText>
            <View style={[styles.probabilityPill, { backgroundColor: severityColor }]}>
              <ThemedText style={styles.probabilityPercent}>
                {diabetesPercent.toFixed(1)}%
              </ThemedText>
            </View>
            <ThemedText style={[styles.probabilityLabel, { color: severityColor }]}>
              Risk Level: {severityLabel}
            </ThemedText>

            <ThemedText style={styles.modelVersionText}>
              Model: {result.model_version}
            </ThemedText>

            {hasBiomarkerData ? (
              <View style={styles.chartSection}>
                <ThemedText type="defaultSemiBold" style={{ marginBottom: 6 }}>
                  Key Biomarkers
                </ThemedText>
                <ThemedText style={styles.chartSubtext}>
                  Range reference for {result.normalized_sex || "unspecified"} profile
                </ThemedText>
                <View style={styles.indicatorStack}>
                  {biomarkerData.map((item) => (
                    <BiomarkerIndicator key={item.key} datum={item} />
                  ))}
                </View>
              </View>
            ) : null}
          </ThemedView>
        )}
      </ThemedView>
      </ParallaxScrollView>
    </ScreenTransitionView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  demographicNotice: {
    marginBottom: 12,
    textAlign: "center",
    opacity: 0.8,
  },
  resultCard: {
    marginTop: 14,
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    backgroundColor: "Transparent",
  },
  probabilityPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  probabilityPercent: {
    color: "white",
    fontFamily: Fonts.sans,
    fontWeight: "700",
    fontSize: 24,
  },
  probabilityLabel: {
    fontFamily: Fonts.sans,
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 10,
  },
  modelVersionText: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 12,
  },
  chartSection: {
    marginTop: 4,
    gap: 8,
  },
  chartSubtext: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 12,
  },
  indicatorStack: {
    gap: 12,
  },
  headerImageContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  headerImageContainerWeb: {
    alignItems: "flex-start",
  },
  placeholderLogo: {
    width: "100%",
    height: "100%",
  },
});
