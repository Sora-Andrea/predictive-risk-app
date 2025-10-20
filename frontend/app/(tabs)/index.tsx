import React, {useState} from 'react';
import { Image } from 'expo-image';
import { Platform, StyleSheet, Pressable, View, Alert } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import UploadModal from "@/components/UploadModal";
import ScreenTransitionView from "@/components/ScreenTransitionView";

import axios from "axios";
import { API_URL } from "@/src/config";
import { useOcrStore } from "@/src/store/useOcrStore";
import { router } from "expo-router";

export default function HomeScreen() {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const isMobile = Platform.OS === 'android' || Platform.OS === 'ios';
  const setOcrFields = useOcrStore((s) => s.setFields);
 
  return (
    <ScreenTransitionView>
      <ParallaxScrollView
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
          ]}>
          <Image
            source={
              isMobile
                ? require('@/assets/images/placeholderLogoM.png')
                : require('@/assets/images/placeholderLogo.png')
            }
            contentFit="contain"
            contentPosition={isMobile ? 'center' : 'left center'}
            style={styles.placeholderLogo}
          />
        </View>
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Predictive Health Risk Assesment</ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText>
          <ThemedText type="defaultSemiBold">The goal is to support earlier intervention and to encourage patients to be more proactive about their health
           by facilitating more efficient communication with their doctors during visits by providing predictive insights that a doctor might find useful.
          </ThemedText>
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Evaluate Risk Score</ThemedText>
        <ThemedText type="defaultSemiBold">Navigate to the Risk tab at the bottom of the screen to input your biomarker data or upload a lab report to auto fill{"\n"}</ThemedText>
        <ThemedText type="defaultSemiBold">If using from mobile device, you may use the camera tab to scan a lab report.{"\n"}</ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
          <ThemedView style={{ alignItems: "center" }}>
            <ThemedText type="subtitle" style={styles.titleContainer}>{"\n"}Automatically Import Your Lab Test Results{"\n"}</ThemedText>
              <View>
                <Pressable
                  onPress={() => {
                    if (!uploading) setOpen(true);
                  }}
                  style={{ opacity: uploading ? 0.6 : 1 }}
                >
                  <Image source={require('@/assets/images/upload_fab.png')} style={styles.uploadButton}/>
                  <ThemedText type="defaultSemiBold" style={styles.buttonUnderText}>
                    {uploading ? "Processing..." : "Upload a Lab Test Results File"}
                    {"\n"}
                  </ThemedText>
                </Pressable>
              </View>
          </ThemedView>
        </ThemedView>
      <UploadModal
        visible={open}
        onClose={() => setOpen(false)}
        onSelected={async (file) => {
          if (!file) return;
          
          setUploading(true);
          try {
            const form = new FormData();
            // Fetch(uri) and blob when mimeType
            let data: any = { uri: file.uri, name: file.name, type: file.mimeType || "application/octet-stream" };

            if (Platform.OS === "web") {
              const blob = await (await fetch(file.uri)).blob();
              data = new File([blob], file.name, { type: file.mimeType || blob.type });
            }
            
            // On native, ensure a proper MIME type for backend allowlist
            if (Platform.OS !== "web") {
              if (!data.type || data.type === "application/octet-stream") {
                const ext = (file.name || "").split(".").pop()?.toLowerCase();
                if (ext === "jpg" || ext === "jpeg") data.type = "image/jpeg";
                else if (ext === "png") data.type = "image/png";
                else if (ext === "pdf") data.type = "application/pdf";
              }
            }
            form.append("file", data as any);

            const res = await axios.post(`${API_URL}/ingest`, form, {
              headers: { "Content-Type": "multipart/form-data" },
            });

            console.log("INGEST response:", res.data);  
            const fields = res.data?.fields || {};
            console.log("OCR fields parsed:", fields);

            // store for the Risk tab
            setOcrFields(fields);
            // navigate to Risk tab
            router.push("/risk");  
          } catch (e: any) {
            console.log("Upload error:", e?.message, e?.response?.data);
            const detail = e?.response?.data?.detail || e?.message || "Failed to process file.";
            Alert.alert("Upload Error", String(detail));
          } finally {
            setUploading(false);
          }
        }}
      />
      </ParallaxScrollView>
    </ScreenTransitionView>
  );
}



const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  buttonUnderText: {
    gap: 16,
    marginBottom: 8,
    alignContent:'center',
    alignSelf:'center'
  },
  uploadButton: {
    height: 71,
    width: 91,
    gap: 2,
    alignSelf:'center',
  },
  headerImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headerImageContainerWeb: {
    alignItems: 'flex-start',
  },
  placeholderLogo: {
    width: '100%',
    height: '100%',
  },
});
