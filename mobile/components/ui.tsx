import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, radius, elevation } from "@/lib/theme";

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "orange";
  size?: "md" | "sm";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const palette = {
    primary: { bg: colors.teal, text: colors.white, border: colors.teal },
    orange: { bg: colors.orange, text: colors.white, border: colors.orange },
    secondary: { bg: "#eef6f7", text: colors.tealDeep, border: "transparent" },
    ghost: { bg: "transparent", text: colors.tealDeep, border: "transparent" },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        if (disabled || loading) return;
        void Haptics.selectionAsync();
        onPress?.();
      }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        size === "sm" ? styles.buttonSm : null,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: pressed || disabled ? 0.72 : 1,
        },
        variant === "primary" || variant === "orange" ? elevation.soft : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <Text style={[styles.buttonText, size === "sm" && styles.buttonTextSm, { color: palette.text }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function Input({
  label,
  error,
  icon,
  ...props
}: TextInputProps & { label?: string; error?: string; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputWrap}>
        {icon ? <Ionicons name={icon} size={18} color={colors.muted} /> : null}
        <TextInput
          placeholderTextColor={colors.muted}
          {...props}
          style={[styles.input, icon ? { paddingLeft: 8 } : null, props.style]}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function Badge({
  label,
  tone = "teal",
}: {
  label: string;
  tone?: "teal" | "orange" | "navy" | "muted" | "white";
}) {
  const palette = {
    teal: { bg: colors.tealSoft, text: colors.tealDeep },
    orange: { bg: colors.orangeSoft, text: colors.orange },
    navy: { bg: "rgba(11,28,44,0.88)", text: colors.white },
    muted: { bg: "#eef3f4", text: colors.muted },
    white: { bg: "rgba(255,255,255,0.94)", text: colors.tealDeep },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.badgeText, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  subtitle,
  icon = "home-outline",
}: {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={26} color={colors.teal} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Spinner() {
  return (
    <View style={styles.empty}>
      <ActivityIndicator color={colors.teal} size="large" />
    </View>
  );
}

export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    borderWidth: 1,
  },
  buttonSm: {
    minHeight: 40,
    paddingHorizontal: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  buttonTextSm: {
    fontSize: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink,
  },
  inputWrap: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.canvas,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.ink,
    paddingVertical: 12,
  },
  error: {
    color: colors.orange,
    fontSize: 13,
    fontWeight: "600",
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  empty: {
    paddingVertical: 56,
    alignItems: "center",
    gap: 8,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.tealSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.navy,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    paddingHorizontal: 28,
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.navy,
  },
  sectionAction: {
    color: colors.teal,
    fontWeight: "700",
    fontSize: 14,
  },
});
