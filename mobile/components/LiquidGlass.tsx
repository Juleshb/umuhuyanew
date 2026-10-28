import { type ReactNode } from "react";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";

/**
 * Soft glass surface for iOS only. On Android/web this renders a solid panel —
 * native Liquid Glass lives on the iOS system tab bar via NativeTabs.
 */
export function LiquidGlass({
  children,
  style,
  contentStyle,
  intensity = 70,
  tint = "light",
  border = true,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: "light" | "dark" | "default";
  border?: boolean;
}) {
  if (Platform.OS !== "ios") {
    return (
      <View style={[styles.androidShell, border ? styles.androidBorder : null, style]}>
        {children ? <View style={contentStyle}>{children}</View> : null}
      </View>
    );
  }

  return (
    <View style={[styles.shell, border ? styles.border : null, style]}>
      <BlurView intensity={intensity} tint={tint} style={styles.fill} />
      <View style={styles.sheen} />
      <View style={styles.tint} />
      {children ? <View style={[styles.content, contentStyle]}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  border: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.72)",
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  androidShell: {
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
  androidBorder: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(20,32,34,0.08)",
  },
  sheen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.85)",
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(244,250,251,0.45)",
  },
  content: {
    zIndex: 1,
  },
});
