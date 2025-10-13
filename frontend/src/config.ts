// Backend base URL priorities
// 1) EXPO_PUBLIC_API_URL env (set in app config or build env)
// 2) If running under Expo dev, derive LAN host and use :8000
// 3) Fallback to localhost:8000
import { Platform } from "react-native";
import Constants from "expo-constants";

function inferHostFromExpo(): string | null {
  const C: any = Constants as any;
  const candidates: (string | undefined)[] = [
    C?.expoConfig?.hostUri,
    C?.manifest2?.extra?.expoClient?.hostUri,
    C?.manifest2?.hostUri,
    C?.manifest?.hostUri,
    C?.manifest?.debuggerHost,
  ];
  for (const cand of candidates) {
    if (!cand) continue;
    const h = String(cand).split(":")[0];
    if (h) return h;
  }
  return null;
}

const envUrl = process.env.EXPO_PUBLIC_API_URL as string | undefined;
let computed = envUrl;

if (!computed) {
  const host = inferHostFromExpo();
  if (host) {
    computed = `http://${host}:8000`;
  }
}

if (!computed) {
  // Platform-specific localhost defaults
  if (Platform.OS === "android") {
    computed = "http://10.0.2.2:8000";
  } else if (Platform.OS === "ios") {
    computed = "http://127.0.0.1:8000";
  } else {
    computed = "http://localhost:8000";
  }
}

export const API_URL = computed;

if (__DEV__) {
  console.log("[API_URL]", API_URL);
}
