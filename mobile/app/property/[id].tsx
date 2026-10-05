import { useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ImageGallery } from "@/components/ImageGallery";
import { Badge, Button, EmptyState, Input, Spinner } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatLocation, formatPrice } from "@/lib/location";
import { colors, radius, elevation } from "@/lib/theme";
import type { Property } from "@/lib/types";

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["property", id],
    enabled: Boolean(id),
    queryFn: () => api<{ data: Property }>(`/properties/${id}`),
  });

  const favorite = useMutation({
    mutationFn: () => api(`/favorites/${id}`, { method: "POST" }),
    onSuccess: () => {
      setNotice("Saved to favorites.");
      void queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
    onError: (err: Error) => setNotice(err.message),
  });

  const inquiry = useMutation({
    mutationFn: () =>
      api("/inquiries", {
        method: "POST",
        json: { propertyId: id, message },
      }),
    onSuccess: () => {
      setMessage("");
      setNotice("Inquiry sent to the agent.");
      void queryClient.invalidateQueries({ queryKey: ["inquiries"] });
    },
    onError: (err: Error) => {
      if (err instanceof ApiError && err.code === "CONTACT_UNLOCK_REQUIRED") {
        setNotice(
          "Pay 5,000 RWF on the website to unlock seller contact, then send an inquiry here."
        );
        return;
      }
      setNotice(err.message);
    },
  });

  const property = data?.data;
  const images = useMemo(() => property?.images ?? [], [property]);
  const closed = property?.status === "SOLD" || property?.status === "RENTED";

  if (isLoading) return <Spinner />;
  if (error || !property) {
    return (
      <EmptyState
        title="Property not found"
        subtitle="This listing may have been removed or is unavailable."
      />
    );
  }

  function requireAuth(action: () => void) {
    if (!user) {
      router.push({ pathname: "/login", params: { next: `/property/${id}` } });
      return;
    }
    action();
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: property.title }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <ImageGallery images={images} title={property.title} />

        <View style={styles.body}>
          <View style={styles.badges}>
            <Badge
              label={property.listingType === "RENT" ? "For rent" : "For sale"}
              tone="teal"
            />
            <Badge label={property.type} tone="muted" />
            {closed ? (
              <Badge label={property.status === "SOLD" ? "Sold" : "Rented"} tone="navy" />
            ) : (
              <Badge label="Available" tone="orange" />
            )}
          </View>

          <Text style={styles.price}>
            {formatPrice(property.price, property.currency)}
            {property.listingType === "RENT" ? " / month" : ""}
          </Text>
          <Text style={styles.title}>{property.title}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={colors.muted} />
            <Text style={styles.location}>{formatLocation(property)}</Text>
          </View>
          {property.address ? <Text style={styles.address}>{property.address}</Text> : null}

          <View style={styles.facts}>
            {property.bedrooms != null ? <Fact label="Bedrooms" value={String(property.bedrooms)} /> : null}
            {property.bathrooms != null ? <Fact label="Bathrooms" value={String(property.bathrooms)} /> : null}
            {property.sizeSqm != null ? <Fact label="Size" value={`${property.sizeSqm} m²`} /> : null}
          </View>

          <Text style={styles.section}>About this home</Text>
          <Text style={styles.description}>{property.description}</Text>

          <View style={styles.agent}>
            <Text style={styles.section}>Listed by</Text>
            <View style={styles.agentCard}>
              <View style={styles.agentAvatar}>
                <Text style={styles.agentInitial}>{property.agent.name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.agentName}>{property.agent.name}</Text>
                <Text style={styles.locked}>
                  {property.contactUnlocked ? "Contact unlocked" : "Contact locked"}
                </Text>
              </View>
            </View>
            {property.contactUnlocked ? (
              <>
                {property.agent.email ? (
                  <Button
                    title={`Email ${property.agent.email}`}
                    variant="secondary"
                    onPress={() => Linking.openURL(`mailto:${property.agent.email}`)}
                  />
                ) : null}
                {property.agent.phone ? (
                  <Button
                    title={`Call ${property.agent.phone}`}
                    variant="secondary"
                    onPress={() => Linking.openURL(`tel:${property.agent.phone}`)}
                  />
                ) : null}
              </>
            ) : (
              <Text style={styles.locked}>
                Unlock seller contact for 5,000 RWF on umuhuzaonline.com
              </Text>
            )}
          </View>

          {notice ? <Text style={styles.notice}>{notice}</Text> : null}

          {!closed ? (
            <View style={{ gap: 10, marginTop: 8 }}>
              <Text style={styles.section}>Send an inquiry</Text>
              <Input
                placeholder="Hi, I would like to visit this property…"
                value={message}
                onChangeText={setMessage}
                multiline
                style={{ minHeight: 100, textAlignVertical: "top" }}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.ctaBar, elevation.soft, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save home"
          onPress={() => requireAuth(() => favorite.mutate())}
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.75 }]}
        >
          <Ionicons
            name={favorite.isSuccess ? "heart" : "heart-outline"}
            size={22}
            color={favorite.isSuccess ? colors.orange : colors.tealDeep}
          />
        </Pressable>
        {!closed ? (
          <Button
            title="Send inquiry"
            loading={inquiry.isPending}
            onPress={() => requireAuth(() => inquiry.mutate())}
            style={{ flex: 1 }}
          />
        ) : (
          <Button title="Save home" variant="secondary" style={{ flex: 1 }} onPress={() => requireAuth(() => favorite.mutate())} />
        )}
      </View>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factValue}>{value}</Text>
      <Text style={styles.factLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  body: { padding: 20, gap: 10 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  title: { fontSize: 24, fontWeight: "700", color: colors.navy, lineHeight: 30 },
  price: { fontSize: 22, fontWeight: "700", color: colors.tealDeep },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  location: { flex: 1, color: colors.muted, fontSize: 15 },
  address: { color: colors.muted, fontSize: 14 },
  facts: { flexDirection: "row", gap: 10, marginTop: 8 },
  fact: {
    flex: 1,
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    padding: 12,
    alignItems: "center",
  },
  factValue: { fontWeight: "700", color: colors.navy, fontSize: 16 },
  factLabel: { color: colors.muted, fontSize: 12, marginTop: 2 },
  section: { fontSize: 17, fontWeight: "700", color: colors.navy, marginTop: 8 },
  description: { fontSize: 15, lineHeight: 22, color: colors.ink },
  agent: { gap: 8, marginTop: 4 },
  agentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.canvas,
    borderRadius: 16,
    padding: 12,
  },
  agentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  agentInitial: { color: colors.white, fontWeight: "700", fontSize: 18 },
  agentName: { fontSize: 16, fontWeight: "700", color: colors.ink },
  locked: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  notice: { color: colors.orange, fontWeight: "600" },
  ctaBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.white,
  },
  saveBtn: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: "#eef6f7",
    alignItems: "center",
    justifyContent: "center",
  },
});
