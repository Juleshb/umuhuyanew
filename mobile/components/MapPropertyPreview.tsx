import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { mediaUrl } from "@/lib/api";
import { formatLocation, formatPrice } from "@/lib/location";
import { colors, elevation, radius } from "@/lib/theme";
import type { Property } from "@/lib/types";
import { Badge } from "./ui";

export function MapPropertyPreview({
  property,
  onClose,
}: {
  property: Property;
  onClose?: () => void;
}) {
  const image = property.images.find((img) => img.isPrimary) ?? property.images[0];
  const closed = property.status === "SOLD" || property.status === "RENTED";

  return (
    <View style={[styles.card, elevation.card]}>
      <View style={styles.imageWrap}>
        {image?.url ? (
          <Image source={{ uri: mediaUrl(image.url) }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons name="image-outline" size={24} color={colors.muted} />
          </View>
        )}
        <View style={styles.overlay}>
          {closed ? (
            <Badge label={property.status === "SOLD" ? "Sold" : "Rented"} tone="navy" />
          ) : (
            <Badge label={property.listingType === "RENT" ? "Rent" : "Sale"} tone="white" />
          )}
        </View>
        {onClose ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close preview"
            hitSlop={8}
            onPress={onClose}
            style={styles.close}
          >
            <Ionicons name="close" size={16} color={colors.white} />
          </Pressable>
        ) : null}
      </View>

      <Pressable
        style={styles.body}
        onPress={() => router.push(`/property/${property.id}`)}
      >
        <Text style={[styles.price, closed && styles.priceClosed]} numberOfLines={1}>
          {formatPrice(property.price, property.currency)}
          {property.listingType === "RENT" && !closed ? (
            <Text style={styles.period}> / mo</Text>
          ) : null}
        </Text>
        <Text style={styles.title} numberOfLines={1}>
          {property.title}
        </Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={13} color={colors.muted} />
          <Text style={styles.location} numberOfLines={1}>
            {formatLocation(property)}
          </Text>
        </View>
        <View style={styles.cta}>
          <Text style={styles.ctaText}>View details</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.teal} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.line,
    minHeight: 118,
  },
  imageWrap: {
    width: 112,
    backgroundColor: colors.mist,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    position: "absolute",
    top: 8,
    left: 8,
  },
  close: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(11,28,44,0.62)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 3,
    justifyContent: "center",
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.tealDeep,
  },
  priceClosed: {
    color: colors.muted,
    textDecorationLine: "line-through",
  },
  period: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.ink,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  location: {
    flex: 1,
    fontSize: 12,
    color: colors.muted,
  },
  cta: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.teal,
  },
});
