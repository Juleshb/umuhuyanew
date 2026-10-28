import { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChipRow } from "@/components/ChipRow";
import { FilterSheet } from "@/components/FilterSheet";
import { MapPropertyPreview } from "@/components/MapPropertyPreview";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertyMapView } from "@/components/PropertyMapView";
import { EmptyState, Input, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import {
  EMPTY_FILTERS,
  buildPropertyQuery,
  countSheetFilters,
  type PropertyFilters,
} from "@/lib/filters";
import { hasCoordinates, type MappedProperty } from "@/lib/map";
import { LISTING_TYPES } from "@/lib/location";
import { colors, elevation, radius } from "@/lib/theme";
import type { PropertyListResponse } from "@/lib/types";

function filtersFromParams(params: Record<string, string | string[] | undefined>): PropertyFilters {
  const pick = (key: keyof PropertyFilters) =>
    typeof params[key] === "string" ? (params[key] as string) : "";

  return {
    ...EMPTY_FILTERS,
    q: pick("q"),
    listingType: pick("listingType"),
    type: pick("type"),
    province: pick("province"),
    district: pick("district"),
    minPrice: pick("minPrice"),
    maxPrice: pick("maxPrice"),
    bedrooms: pick("bedrooms"),
    status: pick("status") || "APPROVED",
  };
}

export default function MapSearchScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const listRef = useRef<FlatList<MappedProperty>>(null);

  const [filters, setFilters] = useState<PropertyFilters>(() => filtersFromParams(params));
  const [searchText, setSearchText] = useState(filters.q);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fitToken, setFitToken] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => (prev.q === searchText ? prev : { ...prev, q: searchText }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const queryString = useMemo(
    () => buildPropertyQuery(filters, { limit: 50 }),
    [filters]
  );
  const activeCount = countSheetFilters(filters);

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ["properties-map", queryString],
    queryFn: () => api<PropertyListResponse>(`/properties?${queryString}`),
  });

  const mapped = useMemo(
    () => (data?.data ?? []).filter(hasCoordinates),
    [data?.data]
  );

  const selected = mapped.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    setFitToken((value) => value + 1);
  }, [queryString, mapped.length]);

  useEffect(() => {
    if (!selectedId) return;
    const index = mapped.findIndex((item) => item.id === selectedId);
    if (index < 0) return;
    listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
  }, [selectedId, mapped]);

  function selectProperty(property: MappedProperty) {
    setSelectedId(property.id);
  }

  function renderCard({ item }: ListRenderItemInfo<MappedProperty>) {
    const active = item.id === selectedId;
    return (
      <Pressable
        onPress={() => selectProperty(item)}
        style={[styles.cardWrap, active && styles.cardActive]}
      >
        <PropertyCard property={item} variant="featured" />
      </Pressable>
    );
  }

  return (
    <View style={styles.screen}>
      <PropertyMapView
        properties={mapped}
        selectedId={selectedId}
        fitToken={fitToken}
        onSelect={setSelectedId}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={[styles.topChrome, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <View style={styles.topRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.navy} />
          </Pressable>

          <View style={styles.searchBox}>
            <Input
              icon="search-outline"
              placeholder="Search area or keyword"
              value={searchText}
              onChangeText={setSearchText}
              returnKeyType="search"
            />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filters"
            onPress={() => setSheetOpen(true)}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="options-outline" size={20} color={colors.navy} />
            {activeCount ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <View style={styles.segmentWrap}>
          <ChipRow
            variant="segment"
            value={filters.listingType}
            onChange={(listingType) => setFilters((prev) => ({ ...prev, listingType }))}
            options={LISTING_TYPES}
          />
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {isLoading || isFetching
              ? "Updating map…"
              : `${mapped.length} on map${
                  data?.meta?.total && data.meta.total > mapped.length
                    ? ` · ${data.meta.total} total`
                    : ""
                }`}
          </Text>
          {mapped.length ? (
            <Pressable onPress={() => setFitToken((value) => value + 1)} style={styles.fitBtn}>
              <Ionicons name="locate-outline" size={14} color={colors.tealDeep} />
              <Text style={styles.fitText}>Fit all</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View
        style={[styles.bottomChrome, { paddingBottom: Math.max(insets.bottom, 12) }]}
        pointerEvents="box-none"
      >
        {error ? (
          <View style={styles.emptyCard}>
            <EmptyState
              title="Could not load map"
              subtitle="Check your connection and try again."
              icon="cloud-offline-outline"
            />
          </View>
        ) : isLoading && !mapped.length ? (
          <View style={styles.emptyCard}>
            <Spinner />
          </View>
        ) : !mapped.length ? (
          <View style={styles.emptyCard}>
            <EmptyState
              title="No mapped homes"
              subtitle="Try another search, or clear filters. Listings need coordinates to appear here."
              icon="map-outline"
            />
          </View>
        ) : selected ? (
          <MapPropertyPreview property={selected} onClose={() => setSelectedId(null)} />
        ) : (
          <FlatList
            ref={listRef}
            horizontal
            data={mapped}
            keyExtractor={(item) => item.id}
            renderItem={renderCard}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carousel}
            onScrollToIndexFailed={() => undefined}
          />
        )}
      </View>

      <FilterSheet
        visible={sheetOpen}
        value={filters}
        onClose={() => setSheetOpen(false)}
        onApply={(next) => {
          setFilters(next);
          setSearchText(next.q);
          setSelectedId(null);
          setSheetOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  topChrome: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    gap: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchBox: {
    flex: 1,
  },
  iconBtn: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    ...elevation.soft,
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.orange,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
  segmentWrap: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 6,
    ...elevation.soft,
  },
  metaRow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.line,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
  },
  fitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  fitText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.tealDeep,
  },
  bottomChrome: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  carousel: {
    gap: 10,
    paddingRight: 8,
  },
  cardWrap: {
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardActive: {
    borderColor: colors.teal,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 18,
    paddingHorizontal: 12,
    minHeight: 140,
    justifyContent: "center",
    ...elevation.card,
  },
});
