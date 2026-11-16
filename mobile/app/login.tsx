import { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { BrandLogo } from "@/components/BrandMark";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";

export default function LoginScreen() {
  const { login, loginWithGoogle } = useAuth();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function redirectAfterLogin(role: string) {
    if (next) {
      router.replace(next as never);
    } else if (role === "AGENT" || role === "ADMIN") {
      router.replace("/listings");
    } else {
      router.replace("/account");
    }
  }

  async function onSubmit() {
    setLoading(true);
    setError(null);
    try {
      const user = await login(email, password);
      redirectAfterLogin(user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  }

  const onGoogleToken = useCallback(
    async (idToken: string) => {
      setLoading(true);
      setError(null);
      try {
        const user = await loginWithGoogle(idToken);
        redirectAfterLogin(user.role);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Google sign-in failed");
        setLoading(false);
      }
    },
    [loginWithGoogle, next]
  );

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <BrandLogo height={48} />
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.sub}>Log in to save favorites and manage your listings.</Text>

        <GoogleSignInButton
          disabled={loading}
          onIdToken={onGoogleToken}
          onError={setError}
        />

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerLabel}>or</Text>
          <View style={styles.divider} />
        </View>

        <Input
          label="Email"
          icon="mail-outline"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          label="Password"
          icon="lock-closed-outline"
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title={loading ? "Signing in…" : "Log in"} loading={loading} onPress={onSubmit} />
        <Button title="Create an account" variant="ghost" onPress={() => router.push("/register")} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  content: { padding: 24, gap: 14, paddingTop: 12 },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.navy,
    marginTop: 8,
    letterSpacing: -0.4,
  },
  sub: { color: colors.muted, fontSize: 15, marginBottom: 4, lineHeight: 22 },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 2,
  },
  divider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.line,
  },
  dividerLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  error: { color: colors.orange, fontWeight: "600" },
});
