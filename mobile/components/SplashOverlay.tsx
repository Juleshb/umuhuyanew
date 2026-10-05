import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { BrandLogo } from "./BrandMark";
import { colors } from "@/lib/theme";

export function SplashOverlay() {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 380,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  return (
    <View style={styles.screen} pointerEvents="auto">
      <Animated.View style={[styles.center, { opacity }]}>
        <BrandLogo variant="light" height={68} />
        <Text style={styles.caption}>Rwanda real estate</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  center: {
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 32,
  },
  caption: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
});
