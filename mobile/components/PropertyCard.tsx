import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { mediaUrl } from "@/lib/api";
import { formatLocation, formatPrice } from "@/lib/location";
import { colors, radius, elevation } from "@/lib/theme";
import type { Property } from "@/lib/types";
import { Badge } from "./ui";

export function PropertyCard({
  property,
  variant = "full",
}: {
  property: Property;
  variant?: "full" | "featured";
}) {
  const image = property.images.find((img) => img.isPrimary) ?? property.images[0];
  const closed = property.status === "SOLD" || property.status === "RENTED";
  const featured = variant === "featured";

  return (
    <Pressable
      onPress={() => router.push(`/property/${property.id}`)}
      style={({ pressed }) => [
        styles.card,
        featured && styles.featured,
        elevation.card,
        pressed && { opacity: 0.94, transform: [{ scale: 0.99 }] },
      ]}
    >
      <View style={[styles.imageWrap, featured && styles.featuredImage]}>
        {image?.url ? (
          <Image
            source={{ uri: mediaUrl(image.url) }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons name="image-outline" size={28} color={colors.muted} />
          </View>
        )}
        <View style={styles.overlay}>
          {closed ? (
            <Badge label={property.status === "SOLD" ? "Sold" : "Rented"} tone="navy" />
          ) : (
            <Badge
              label={property.listingType === "RENT" ? "Rent" : "Sale"}
              tone="white"
            />
          )}
        </View>
        {property.images.length > 1 ? (
          <View style={styles.countBadge}>
            <Ionicons name="images-outline" size={12} color={colors.white} />
            <Text style={styles.countText}>{property.images.length}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
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
          <Ionicons name="location-outline" size={14} color={colors.muted} />
          <Text style={styles.location} numberOfLines={1}>
            {formatLocation(property)}
          </Text>
        </View>
        <View style={styles.meta}>
          {property.bedrooms != null ? (
            <Meta icon="bed-outline" label={`${property.bedrooms} bd`} />
          ) : null}
          {property.bathrooms != null ? (
            <Meta icon="water-outline" label={`${property.bathrooms} ba`} />
          ) : null}
          {property.sizeSqm != null ? (
            <Meta icon="resize-outline" label={`${property.sizeSqm} m²`} />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function Meta({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={14} color={colors.teal} />
      <Text style={styles.metaText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.line,
  },
  featured: {
    width: 268,
  },
  imageWrap: {
    width: "100%",
    height: 178,
    backgroundColor: colors.mist,
  },
  featuredImage: {
    height: 158,
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.mist,
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    position: "absolute",
    top: 12,
    left: 12,
  },
  countBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(11,28,44,0.72)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  countText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
  },
  body: {
    padding: 14,
    gap: 5,
  },
  price: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.tealDeep,
  },
  priceClosed: {
    color: colors.muted,
    textDecorationLine: "line-through",
  },
  period: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  location: {
    flex: 1,
    fontSize: 13,
    color: colors.muted,
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(20,32,34,0.7)",
  },
});
