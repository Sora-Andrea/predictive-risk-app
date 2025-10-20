import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Pressable, Image, Alert, useWindowDimensions } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import axios from "axios";
import { API_URL } from "@/src/config";
import { useOcrStore } from "@/src/store/useOcrStore";
import { router } from "expo-router";
import ScreenTransitionView from "@/components/ScreenTransitionView";

/*
 Camera tab:
  • requests permission CHECK
  • shows live preview CHECK
  • takes a photo and shows a thumbnail CHECK
  • works on iOS/Android CHECK
  > Webcam takes the entire screen on PC <
  • Desktop version needs fixing, perhaps modal window will recommend the user to utilize mobile camera for better quality or upload a file instead
  */


export default function CameraTab() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [taking, setTaking] = useState(false);
  const setOcrFields = useOcrStore((s) => s.setFields);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const horizontalPadding = Math.max(screenWidth * 0.08, 24);
  let previewWidth = screenWidth - horizontalPadding;
  previewWidth = Math.max(Math.min(previewWidth, 720), 280);

  const maxPreviewHeight = Math.max(screenHeight * 0.6, 320);
  let previewHeight = previewWidth * (4 / 3);

  if (previewHeight > maxPreviewHeight) {
    previewHeight = maxPreviewHeight;
    previewWidth = previewHeight * (3 / 4);
  }

  const guideWidth = previewWidth * 0.82;
  const guideAspect = 11 / 8.5;
  let guideHeight = guideWidth * guideAspect;
  const guideHeightCap = previewHeight * 0.78;

  if (guideHeight > guideHeightCap) {
    guideHeight = guideHeightCap;
  }

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  if (!permission) {
    return (
      <Centered>
        <ThemedText>Checking camera permission…</ThemedText>
      </Centered>
    );
  }

  if (!permission.granted) {
    return (
      <Centered>
        <ThemedText style={{ textAlign: "center", marginBottom: 12 }}>
          Access to your camera is required to continue.
        </ThemedText>
        <PrimaryButton onPress={requestPermission} label="Grant Camera Permission" />
      </Centered>
    );
  }

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      setTaking(true);
      // return a uri
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1.0
      });
      setPhotoUri(photo?.uri ?? null);
      if (!photo?.uri) return;

      // Build multipart form for backend OCR ingest
      const form = new FormData();
      const file: any = { uri: photo.uri, name: "camera.jpg", type: "image/jpeg" };
      form.append("file", file);

      try {
        const res = await axios.post(`${API_URL}/ingest`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const fields = res.data?.fields || {};
        setOcrFields(fields);
        // Navigate to Risk tab to view populated fields
        router.push("/risk");
      } catch (err: any) {
        console.log("Camera ingest error:", err?.message, err?.response?.data);
        Alert.alert("OCR Error", err?.response?.data?.detail || err?.message || "Failed to process photo.");
      }
    } finally {
      setTaking(false);
    }
  };

  return (
    <ScreenTransitionView>
      <ThemedView style={styles.screen}>
        <View style={[styles.previewContainer, { width: previewWidth, height: previewHeight }]}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            enableTorch={false}
            zoom={0}
          />
          <View pointerEvents="none" style={[styles.guide, { width: guideWidth, height: guideHeight }]} />
        </View>

        <View style={styles.controls}>
          <PrimaryButton onPress={takePhoto} label={taking ? "Processing..." : "Take & Scan"} disabled={taking} />
        </View>

        {photoUri && (
          <View style={styles.result}>
            <ThemedText type="defaultSemiBold" style={{ marginBottom: 6 }}>
              Last Photo
            </ThemedText>
            <Image
              source={{ uri: photoUri }}
              style={{ width: 160, height: 160, borderRadius: 12, backgroundColor: "#eee" }}
              resizeMode="cover"
            />
          </View>
        )}
      </ThemedView>
    </ScreenTransitionView>
  );
}


function Centered({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>{children}</View>;
}

function PrimaryButton({
  onPress,
  label,
  disabled,
}: {
  onPress: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: "black",
        opacity: disabled ? 0.5 : 1,
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 10,
        alignItems: "center",
      }}
    >
      <ThemedText style={{ color: "white", fontWeight: "700" }}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  previewContainer: {
    backgroundColor: "#000",
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  camera: {
    width: "100%",
    height: "100%",
  },
  controls: {
    alignItems: "center",
    justifyContent: "center",
  },
  result: {
    alignItems: "center",
    paddingBottom: 24,
    gap: 8,
  },
  guide: {
    position: "absolute",
    borderWidth: 2,
    borderRadius: 16,
    borderColor: "rgba(255,255,255,0.65)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
});
