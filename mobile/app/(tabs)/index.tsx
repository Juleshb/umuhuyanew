import { useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandLogo } from "@/components/BrandMark";
import { AdBanner } from "@/components/AdBanner";
import { ChipRow } from "@/components/ChipRow";
import { PropertyCard } from "@/components/PropertyCard";
import { Button, SectionHeader, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { tabBarClearance } from "@/lib/layout";
import { PROVINCES } from "@/lib/location";
import { colors, elevation } from "@/lib/theme";
import type { AdBanner as Banner, PropertyListResponse } from "@/lib/types";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [tab, setTab] = useState<"RENT" | "SALE" | "SELL">("RENT");
  const [province, setProvince] = useState("Kigali");

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["landing-properties"],
    queryFn: () => api<PropertyListResponse>("/properties?status=APPROVED&limit=8"),
  });

  const bannersQuery = useQuery({
    queryKey: ["ad-banners"],
    queryFn: () => api<{ data: Banner[] }>("/banners"),
  });

  const featured = data?.data ?? [];
  const greeting = user ? `Hello, ${user.name.split(" ")[0]}` : "Find your next home";

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: tabBarClearance(insets.bottom) }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching || bannersQuery.isRefetching}
          onRefresh={() => {
            void refetch();
            void bannersQuery.refetch();
          }}
          tintColor={colors.teal}
        />
      }
    >
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <BrandLogo height={34} />
      </View>

      <AdBanner banners={bannersQuery.data?.data ?? []} />

      <View style={styles.hero}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.headline}>Buy, rent, or sell with trusted local agents</Text>

          <View style={[styles.searchCard, elevation.card]}>
          <ChipRow
            variant="segment"
            value={tab}
            onChange={(value) => setTab(value as typeof tab)}
            options={[
              { value: "RENT", label: "Rent" },
              { value: "SALE", label: "Buy" },
              { value: "SELL", label: "Sell" },
            ]}
          />
          {tab !== "SELL" ? (
            <View style={styles.locationBlock}>
              <Text style={styles.fieldLabel}>Location</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.locRow}>
                {PROVINCES.map((item) => {
                  const active = province === item.value;
                  const label = item.label.replace(" Province", "").replace(" City", "");
                  return (
                    <Pressable
                      key={item.value}
                      accessibilityRole="button"
                      onPress={() => setProvince(item.value)}
                      style={[styles.locChip, active && styles.locChipActive]}
                    >
                      <Text style={[styles.locChipText, active && styles.locChipTextActive]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : (
            <Text style={styles.sellHint}>List your property and reach buyers across Rwanda.</Text>
          )}
          <Button
            title={tab === "SELL" ? "Start listing" : "Search properties"}
            onPress={() => {
              if (tab === "SELL") {
                router.push(user ? "/listing-new" : "/register");
                return;
              }
              router.push({
                pathname: "/explore",
                params: { listingType: tab, province },
              });
            }}
          />
        </View>

        <View style={styles.stats}>
          <Stat value="1k+" label="Buyers" />
          <View style={styles.statDivider} />
          <Stat value={`${data?.meta.total ?? featured.length}+`} label="Listings" />
          <View style={styles.statDivider} />
          <Stat value="5" label="Provinces" />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Featured listings"
          action="See all"
          onAction={() => router.push("/explore")}
        />
      </View>
      {isLoading ? <Spinner /> : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.featuredRow}
      >
        {featured.map((property) => (
          <PropertyCard key={property.id} property={property} variant="featured" />
        ))}
      </ScrollView>

      <View style={styles.section}>
        <SectionHeader title="Latest on the market" />
        <View style={{ gap: 14, marginTop: 12 }}>
          {featured.slice(0, 4).map((property) => (
            <PropertyCard key={`full-${property.id}`} property={property} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statNum}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
    gap: 12,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: colors.white,
  },
  greeting: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
  },
  headline: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    color: colors.navy,
    letterSpacing: -0.4,
  },
  searchCard: {
    marginTop: 4,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  locationBlock: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
  },
  locRow: {
    gap: 8,
    paddingRight: 8,
    alignItems: "center",
  },
  locChip: {
    backgroundColor: "#eef4f5",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  locChipActive: {
    backgroundColor: colors.teal,
  },
  locChipText: {
    color: colors.muted,
    fontWeight: "600",
    fontSize: 13,
  },
  locChipTextActive: {
    color: colors.white,
  },
  sellHint: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.line,
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.line,
  },
  statNum: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.navy,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  featuredRow: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 14,
  },
});
