import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "@/lib/theme";

type Option = { value: string; label: string };

export function ChipRow({
  options,
  value,
  onChange,
  variant = "wrap",
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  variant?: "wrap" | "segment";
}) {
  if (variant === "segment") {
    return (
      <View style={styles.segment}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <Pressable
              key={option.value || "all"}
              accessibilityRole="button"
              onPress={() => onChange(option.value)}
              style={[styles.segmentItem, active && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value || "all"}
            accessibilityRole="button"
            onPress={() => onChange(option.value)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#eef3f4",
  },
  chipActive: {
    backgroundColor: colors.teal,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
  },
  chipTextActive: {
    color: colors.white,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: "#eef4f5",
    borderRadius: 12,
    padding: 4,
  },
  segmentItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
    borderRadius: 9,
  },
  segmentActive: {
    backgroundColor: colors.white,
    shadowColor: "#142022",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.muted,
  },
  segmentTextActive: {
    color: colors.navy,
    fontWeight: "700",
  },
});
