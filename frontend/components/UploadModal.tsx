import React from "react";
import { Modal, View, Pressable, Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

type UploadModalProps = {
  visible: boolean;
  onClose: () => void;
  //  cancel on null otherwise continue
  onSelected: (file: {
    name: string;
    mimeType: string | null;
    size: number | null;
    uri: string;
  } | null) => void;
};

const ACCEPTED_MIME = ["image/jpeg", "image/png", "application/pdf"];

const PICKER_TYPES = Platform.OS === "web"
  ? ["image/jpeg", "image/png", "application/pdf"]
  : ["*/*"];

export default function UploadModal({ visible, onClose, onSelected }: UploadModalProps) {
  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        multiple: false,
        type: PICKER_TYPES,
        copyToCacheDirectory: true,
      });

      if (res.canceled) {
        onSelected(null);
        return;
      }

      const asset = res.assets?.[0];
      if (!asset) {
        onSelected(null);
        return;
      }

      const file = {
        name: asset.name ?? "file",
        mimeType: asset.mimeType ?? null,
        size: asset.size ?? null,
        uri: asset.uri,
      };

      const ext = (file.name.split(".").pop() || "").toLowerCase();
      const byExt = ["jpg", "jpeg", "png", "pdf"].includes(ext);
      const byMime = file.mimeType ? ACCEPTED_MIME.includes(file.mimeType) : false;

      if (!(byMime || byExt)) {
        alert("Only JPEG, PNG, or PDF files are allowed.");
        onSelected(null);
        return;
      }

      onSelected(file);
    } catch (e: any) {
      console.log("Document pick error:", e?.message);
      onSelected(null);
    } finally {
      onClose();
    }
  };

  return (
    
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "#00000090",
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        <ThemedView
          style={{
            width: "100%",
            padding: 16,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            gap: 12,
          }}
        >
          <ThemedText type="title">Upload a file</ThemedText>
          <ThemedText>
            Supported formats: JPEG, PNG, or PDF
          </ThemedText>

          <Pressable
            onPress={pickFile}
            style={{
              backgroundColor: "#0891b2",
              paddingVertical: 12,
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            <ThemedText style={{ color: "white", fontWeight: "700" }}>
              Choose file
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={onClose}
            style={{
              paddingVertical: 10,
              alignItems: "center",
              borderRadius: 10,
              backgroundColor: "#ff0000ff",
            }}
          >
            <ThemedText>Cancel</ThemedText>
          </Pressable>
        </ThemedView>
      </View>
    </Modal>
  );
}
