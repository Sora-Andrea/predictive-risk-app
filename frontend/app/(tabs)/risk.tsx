import React, { useState } from "react";
import { StyleSheet, View, TextInput, Pressable } from "react-native";
import axios from "axios";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts } from "@/constants/theme";
import { API_URL } from "@/src/config";

// Fields
type FieldProps = {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  inputMode?: "text" | "numeric" | "decimal";
  placeholder?: string;
};

const Field = React.memo(function Field({
  label,
  value,
  onChangeText,
  inputMode,
  placeholder,
}: FieldProps) {
  return (
    <View style={{ marginBottom: 12 }}>
      <ThemedText type="defaultSemiBold" style={{ marginBottom: 6 }}>
        {label}
      </ThemedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        inputMode={inputMode || "text"}
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

export default function ExploreScreen() {
  const [age, setAge] = useState("45");
  const [sex, setSex] = useState("male");
  const [totalCholesterol, setTotalCholesterol] = useState("210");
  const [hdl, setHdl] = useState("45");
  const [systolicBp, setSystolicBp] = useState("130");
  const [smoker, setSmoker] = useState("false");

  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const payload = {
        age: parseInt(age, 10),
        sex: sex,
        total_cholesterol: parseFloat(totalCholesterol),
        hdl: parseFloat(hdl),
        systolic_bp: parseFloat(systolicBp),
        smoker: smoker === "true",
      };
      const res = await axios.post(`${API_URL}/predict`, payload);
      setResult(res.data);
    } catch (e: any) {
      console.log("Predict error:", e?.message);
      setError(e?.message ?? "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}
        >
          Predictive Health Risk
        </ThemedText>
      </ThemedView>

      <ThemedText style={{ marginBottom: 16 }}>
        Enter your health data below to generate a risk assessment.
      </ThemedText>

      <ThemedView
        style={{
          padding: 16,
          borderRadius: 12,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: "#e5e7eb"
        }}
      >
        <Field label="Age" value={age} onChangeText={setAge} inputMode="numeric" placeholder="e.g., 45" />
        <Field label="Sex (male/female)" value={sex} onChangeText={setSex} placeholder="male or female" />
        <Field
          label="Total Cholesterol"
          value={totalCholesterol}
          onChangeText={setTotalCholesterol}
          inputMode="decimal"
          placeholder="e.g., 210"
        />
        <Field label="HDL" value={hdl} onChangeText={setHdl} inputMode="decimal" placeholder="e.g., 45" />
        <Field
          label="Systolic BP"
          value={systolicBp}
          onChangeText={setSystolicBp}
          inputMode="decimal"
          placeholder="e.g., 130"
        />
        <Field
          label="Smoker (true/false)"
          value={smoker}
          onChangeText={setSmoker}
          placeholder="true or false"
        />

        <Pressable
          onPress={submit}
          style={{
            backgroundColor: "blue",
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: "center",
            marginTop: 8,
            opacity: loading ? 0.6 : 1,
          }}
          disabled={loading}
        >
          <ThemedText type="defaultSemiBold" style={{ color: "white" }}>
            {loading ? "Predicting..." : "Predict"}
          </ThemedText>
        </Pressable>

        {error && (
          <ThemedText style={{ marginTop: 10, color: "#c62828" }}>{error}</ThemedText>
        )}

        {result && (
          <ThemedView
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 10,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: "#e5e7eb"
            }}
          >
            <ThemedText type="defaultSemiBold" style={{ marginBottom: 4 }}>
              Result
            </ThemedText>
            <ThemedText>Risk Score: {result.risk_score}</ThemedText>
            <ThemedText>
              Concern Level: {result.risk_level ?? result.risk_level}
            </ThemedText>
          

            <View
              style={{
                marginTop: 10,
                height: 12,
                backgroundColor: "#eee",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: `${Math.min(100, Math.max(0, (result.risk_score || 0) * 100))}%`,
                  height: "100%",
                  backgroundColor:
                    (result.risk_level ?? result.risk_level) === "high"
                      ? "#c62828"
                      : (result.risk_level ?? result.risk_level) === "moderate"
                      ? "#f9a825"
                      : "#2e7d32",
                }}
              />
            </View>
          </ThemedView>
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
});
