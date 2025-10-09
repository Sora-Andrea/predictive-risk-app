import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Pressable, Image } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

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
    } finally {
      setTaking(false);
    }
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <View style={styles.previewContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          enableTorch={false}
          zoom={0}
        />
      </View>

      <View style={styles.controls}>
        <PrimaryButton onPress={takePhoto} label={taking ? "Taking…" : "Take Photo"} disabled={taking} />
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
  previewContainer: {
    aspectRatio: 3 / 4,
    width: "100%",
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: "hidden",
  },
  controls: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  result: {
    alignItems: "center",
    paddingBottom: 24,
    gap: 8,
  },
});
