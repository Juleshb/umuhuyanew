import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BrandLogo } from "@/components/BrandMark";
import { Button, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { tabBarClearance } from "@/lib/layout";
import { colors, radius, elevation } from "@/lib/theme";

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { user, loading, logout } = useAuth();
  const isAgent = user?.role === "AGENT" || user?.role === "ADMIN";

  if (loading) return <Spinner />;

  if (!user) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top, paddingBottom: tabBarClearance(insets.bottom) }]}>
        <BrandLogo height={52} />
        <Text style={styles.title}>Your account</Text>
        <Text style={styles.sub}>
          Save homes, send inquiries, and manage listings from your phone.
        </Text>
        <Button title="Log in" onPress={() => router.push("/login")} />
        <Button
          title="Create an account"
          variant="secondary"
          onPress={() => router.push("/register")}
        />
      </View>
    );
  }

  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + 12, padding: 20, gap: 14, paddingBottom: tabBarClearance(insets.bottom) }}
    >
      <BrandLogo height={36} />
      <View style={[styles.profile, elevation.soft]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.meta}>{user.email}</Text>
          <Text style={styles.role}>{user.role.toLowerCase()}</Text>
        </View>
      </View>
      {user.role === "AGENT" ? (
        <Text style={styles.note}>
          {user.agentActive
            ? "Your agent subscription is active."
            : "Activate your agent account on the website to post listings."}
        </Text>
      ) : null}

      <View style={styles.group}>
        <Row icon="chatbubbles-outline" label="Inquiries" onPress={() => router.push("/inquiries")} />
        {isAgent ? (
          <Row icon="home-outline" label="My listings" onPress={() => router.push("/listings")} />
        ) : (
          <Row icon="add-circle-outline" label="List a property" onPress={() => router.push("/listing-new")} />
        )}
        <Row icon="heart-outline" label="Saved homes" onPress={() => router.push("/saved")} last />
      </View>

      <Button
        title="Log out"
        variant="secondary"
        onPress={() => {
          Alert.alert("Log out", "Sign out of Umuhuza on this device?", [
            { text: "Cancel", style: "cancel" },
            { text: "Log out", style: "destructive", onPress: () => void logout() },
          ]);
        }}
      />
    </ScrollView>
  );
}

function Row({
  icon,
  label,
  onPress,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.teal} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  center: {
    padding: 28,
    gap: 12,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.navy,
    letterSpacing: -0.4,
  },
  sub: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 18,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.navy,
  },
  meta: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 2,
  },
  role: {
    marginTop: 6,
    alignSelf: "flex-start",
    color: colors.tealDeep,
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  note: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  group: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.tealSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
  },
});
