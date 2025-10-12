// Backend base URL
// Priority:
// 1) EXPO_PUBLIC_API_URL env (set in app config or build env)
// 2) If running under Expo dev, derive LAN host and use :8000
// 3) Fallback to localhost:8000
import { Platform } from "react-native";
import Constants from "expo-constants";

function inferHostFromExpo(): string | null {
  const hostUri: string | undefined = (Constants as any)?.expoConfig?.hostUri || (Constants as any)?.manifest2?.hostUri || (Constants as any)?.manifest?.hostUri;
  if (!hostUri) return null;
  // e.g. "192.168.1.25:19000" or "127.0.0.1:19006"
  const host = hostUri.split(":")[0];
  if (!host) return null;
  return host;
}

const envUrl = process.env.EXPO_PUBLIC_API_URL as string | undefined;
let computed = envUrl;

if (!computed) {
  // Try to infer Expo dev host on device/simulator
  const host = inferHostFromExpo();
  if (host) {
    computed = `http://${host}:8000`;
  }
}

if (!computed) {
  // Platform-specific localhost defaults
  // - web: localhost resolves fine
  // - iOS simulator: 127.0.0.1
  // - Android emulator: 10.0.2.2 maps to host localhost
  if (Platform.OS === "android") {
    computed = "http://10.0.2.2:8000";
  } else if (Platform.OS === "ios") {
    computed = "http://127.0.0.1:8000";
  } else {
    computed = "http://localhost:8000";
  }
}

export const API_URL = computed;
