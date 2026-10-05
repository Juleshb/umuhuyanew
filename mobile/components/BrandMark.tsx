import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

const logos = {
  color: require("../assets/brand/logo-color.png"),
  light: require("../assets/brand/logo-light.png"),
};

export function BrandLogo({
  variant = "color",
  height = 44,
}: {
  variant?: "color" | "light";
  height?: number;
}) {
  const width = Math.round(height * (647 / 341));
  return (
    <Image
      source={logos[variant]}
      style={{ width, height }}
      contentFit="contain"
      accessibilityLabel="Umuhuza Online"
    />
  );
}

export function BrandMark({
  compact = false,
  variant = "color",
}: {
  compact?: boolean;
  variant?: "color" | "light";
}) {
  return (
    <View style={styles.wrap}>
      <BrandLogo variant={variant} height={compact ? 36 : 48} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "flex-start",
  },
});
