import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Fonts } from "@/constants/theme";

export type BiomarkerIndicatorDatum = {
  key: string;
  label: string;
  value: number | null;
  unit?: string | null;
  low: number | null;
  high: number | null;
  status: "low" | "normal" | "high" | "unknown";
};

const STATUS_COLORS: Record<BiomarkerIndicatorDatum["status"], string> = {
  low: "#facc15",
  normal: "#22c55e",
  high: "#facc15",
  unknown: "#94a3b8",
};

const STATUS_LABELS: Record<BiomarkerIndicatorDatum["status"], string> = {
  low: "Below range",
  normal: "Within range",
  high: "Above range",
  unknown: "No recent value",
};

const formatValue = (value: number | null, unit?: string | null) => {
  if (value === null || Number.isNaN(value)) {
    return "--";
  }
  const abs = Math.abs(value);
  const formatted =
    abs >= 100 ? value.toFixed(0) : abs >= 10 ? value.toFixed(1) : value.toFixed(2);
  return `${formatted}${unit ? ` ${unit}` : ""}`;
};

const formatRange = (low: number | null, high: number | null, unit?: string | null) => {
  if (low === null && high === null) {
    return "Reference range unavailable";
  }
  if (low === null) {
    return `Upper limit: ${formatValue(high, unit)}`;
  }
  if (high === null) {
    return `Lower limit: ${formatValue(low, unit)}`;
  }
  return `${formatValue(low, unit)} - ${formatValue(high, unit)}`;
};

const TRACK_GREEN = "#22c55e";
const TRACK_YELLOW = "#facc15";
const TRACK_NEUTRAL = "#e2e8f0";

type PercentString = `${number}%`;
type MarkerPositionStyle = {
  left?: number | PercentString;
  right?: number | PercentString;
  transform?: ViewStyle["transform"];
};

const BiomarkerIndicator: React.FC<{ datum: BiomarkerIndicatorDatum }> = ({ datum }) => {
  const markerColor = STATUS_COLORS[datum.status];

  const segments = (() => {
    const hasLow = datum.low !== null;
    const hasHigh = datum.high !== null;
    if (hasLow && hasHigh) return [TRACK_YELLOW, TRACK_GREEN, TRACK_YELLOW];
    if (!hasLow && hasHigh) return [TRACK_GREEN, TRACK_YELLOW];
    if (hasLow && !hasHigh) return [TRACK_YELLOW, TRACK_GREEN];
    return [TRACK_NEUTRAL];
  })();

  const markerPosition: MarkerPositionStyle = (() => {
    const base: MarkerPositionStyle = { transform: [{ translateX: -6 }] };
    const hasLow = datum.low !== null;
    const hasHigh = datum.high !== null;
    switch (datum.status) {
      case "low":
        return { left: 0 };
      case "high":
        return { right: 0 };
      case "normal":
        if (hasLow && hasHigh) {
          return { left: "50%" as PercentString, ...base };
        }
        if (!hasLow && hasHigh) {
          return { left: "35%" as PercentString, ...base };
        }
        if (hasLow && !hasHigh) {
          return { right: "35%" as PercentString, ...base };
        }
        return { left: "50%" as PercentString, ...base };
      case "unknown":
      default:
        return { left: "50%" as PercentString, ...base };
    }
  })();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText type="defaultSemiBold" style={styles.label}>
          {datum.label}
        </ThemedText>
        <ThemedText style={styles.valueText}>{formatValue(datum.value, datum.unit)}</ThemedText>
      </View>
      <View style={styles.trackWrapper}>
        {segments.map((color, idx) => (
          <View key={`${datum.key}-segment-${idx}`} style={[styles.trackSegment, { backgroundColor: color }]} />
        ))}
        <View style={[styles.marker, markerPosition, { borderColor: markerColor }]} />
      </View>
      <View style={styles.footerRow}>
        <ThemedText style={[styles.statusText, { color: markerColor }]}>
          {STATUS_LABELS[datum.status]}
        </ThemedText>
        <ThemedText style={styles.rangeText}>{formatRange(datum.low, datum.high, datum.unit)}</ThemedText>
      </View>
    </View>
  );
};

export default BiomarkerIndicator;

const styles = StyleSheet.create({
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "Transparent",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
  },
  valueText: {
    fontFamily: Fonts.sans,
    fontWeight: "600",
    fontSize: 14,
  },
  trackWrapper: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    height: 10,
    borderRadius: 6,
    overflow: "hidden",
  },
  trackSegment: {
    flex: 1,
    height: "100%",
  },
  marker: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    backgroundColor: "#fff",
    top: -1,
  },
  footerRow: {
    marginTop: 10,
  },
  statusText: {
    fontFamily: Fonts.sans,
    fontWeight: "600",
    fontSize: 12,
    marginBottom: 2,
  },
  rangeText: {
    fontSize: 12,
    color: "#64748b",
  },
});
