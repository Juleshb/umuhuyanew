import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { BrandLogo } from "@/components/BrandMark";
import { ChipRow } from "@/components/ChipRow";
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";

export default function RegisterScreen() {
  const { register } = useAuth();
  const params = useLocalSearchParams<{ role?: string }>();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"BUYER" | "AGENT">(
    params.role === "AGENT" ? "AGENT" : "BUYER"
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setLoading(true);
    setError(null);
    try {
      const user = await register({
        name,
        email,
        phone: phone || undefined,
        password,
        role,
      });
      router.replace(user.role === "AGENT" ? "/listings" : "/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <BrandLogo height={52} />
        <Text style={styles.title}>Join Umuhuza</Text>
        <Text style={styles.sub}>Create an account as a buyer/renter or an agent.</Text>
        <ChipRow
          variant="segment"
          value={role}
          onChange={(value) => setRole(value as "BUYER" | "AGENT")}
          options={[
            { value: "BUYER", label: "Buyer" },
            { value: "AGENT", label: "Agent" },
          ]}
        />
        <Input label="Full name" icon="person-outline" value={name} onChangeText={setName} />
        <Input
          label="Email"
          icon="mail-outline"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          label="Phone"
          icon="call-outline"
          keyboardType="phone-pad"
          placeholder="+250…"
          value={phone}
          onChangeText={setPhone}
        />
        <Input
          label="Password"
          icon="lock-closed-outline"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          title={loading ? "Creating account…" : "Create account"}
          loading={loading}
          onPress={onSubmit}
        />
        <Button title="I already have an account" variant="ghost" onPress={() => router.push("/login")} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  content: { padding: 24, gap: 14, paddingBottom: 40 },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.navy,
    marginTop: 8,
    letterSpacing: -0.4,
  },
  sub: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  error: { color: colors.orange, fontWeight: "700" },
});
