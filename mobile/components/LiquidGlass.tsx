import { type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";

export function LiquidGlass({
  children,
  style,
  contentStyle,
  intensity = 64,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  intensity?: number;
}) {
  return (
    <View style={[styles.shell, style]}>
      <BlurView intensity={intensity} tint="light" style={styles.fill} />
      <View style={styles.tint} />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.65)",
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  fill: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  tint: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(255,255,255,0.42)",
  },
  content: {
    zIndex: 1,
  },
});
