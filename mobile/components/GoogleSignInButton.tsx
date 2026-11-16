import { useEffect } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "@/lib/theme";

WebBrowser.maybeCompleteAuthSession();

function readClientIds() {
  const web = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || undefined;
  const ios = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || web;
  const android = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || web;
  return { web, ios, android, ready: Boolean(web || ios || android) };
}

/**
 * Only mount this when Google client IDs exist — the Expo Google hook throws if
 * the platform client id is missing.
 */
export function GoogleSignInButton({
  disabled,
  onIdToken,
  onError,
}: {
  disabled?: boolean;
  onIdToken: (idToken: string) => void | Promise<void>;
  onError?: (message: string) => void;
}) {
  const { web, ios, android, ready } = readClientIds();

  if (!ready) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          onError?.(
            "Google sign-in is not configured. Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (and EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID for iOS) to mobile/.env."
          )
        }
        style={({ pressed }) => [styles.googleBtn, pressed && { opacity: 0.75 }]}
      >
        <Ionicons name="logo-google" size={18} color={colors.navy} />
        <Text style={styles.googleText}>Continue with Google</Text>
      </Pressable>
    );
  }

  return (
    <GoogleSignInButtonConfigured
      web={web}
      ios={ios}
      android={android}
      disabled={disabled}
      onIdToken={onIdToken}
      onError={onError}
    />
  );
}

function GoogleSignInButtonConfigured({
  web,
  ios,
  android,
  disabled,
  onIdToken,
  onError,
}: {
  web?: string;
  ios?: string;
  android?: string;
  disabled?: boolean;
  onIdToken: (idToken: string) => void | Promise<void>;
  onError?: (message: string) => void;
}) {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    // Expo resolves platform id as iosClientId ?? clientId on iOS
    clientId: web,
    iosClientId: ios,
    androidClientId: android,
    webClientId: web,
    // Helps Expo Go use the web client when native IDs are not set
    expoClientId: web,
  });

  useEffect(() => {
    if (response?.type !== "success") return;
    const idToken =
      response.params.id_token ||
      // some flows put it on authentication
      (response as { authentication?: { idToken?: string | null } }).authentication?.idToken;
    if (!idToken) {
      onError?.("Google did not return an ID token");
      return;
    }
    void Promise.resolve(onIdToken(idToken)).catch((err) => {
      onError?.(err instanceof Error ? err.message : "Google sign-in failed");
    });
  }, [response, onIdToken, onError]);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || !request}
      onPress={() => {
        void promptAsync().catch((err) => {
          onError?.(err instanceof Error ? err.message : "Could not open Google sign-in");
        });
      }}
      style={({ pressed }) => [
        styles.googleBtn,
        (pressed || disabled || !request) && { opacity: 0.75 },
      ]}
    >
      <Ionicons name="logo-google" size={18} color={colors.navy} />
      <Text style={styles.googleText}>Continue with Google</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  googleBtn: {
    marginTop: 4,
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  googleText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.navy,
  },
});
