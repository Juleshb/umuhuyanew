import { useState } from "react";
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
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { colors, radius } from "@/lib/theme";

export default function LoginScreen() {
  const { login } = useAuth();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setLoading(true);
    setError(null);
    try {
      const user = await login(email, password);
      if (next) {
        router.replace(next as never);
      } else if (user.role === "AGENT" || user.role === "ADMIN") {
        router.replace("/listings");
      } else {
        router.replace("/account");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <BrandLogo height={48} />
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.sub}>Log in to save favorites and manage your listings.</Text>
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
        <View style={styles.demo}>
          <Text style={styles.demoTitle}>Demo · password123</Text>
          <Text style={styles.demoText}>buyer@umuhuza.rw · claire@umuhuza.rw</Text>
        </View>
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
  error: { color: colors.orange, fontWeight: "600" },
  demo: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    padding: 12,
    gap: 4,
    marginTop: 8,
  },
  demoTitle: { fontWeight: "600", color: colors.ink, fontSize: 12 },
  demoText: { color: colors.muted, fontSize: 12 },
});
