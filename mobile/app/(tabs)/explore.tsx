import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChipRow } from "@/components/ChipRow";
import { FilterSheet } from "@/components/FilterSheet";
import { PropertyCard } from "@/components/PropertyCard";
import { EmptyState, Input, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import {
  EMPTY_FILTERS,
  buildPropertyQuery,
  countSheetFilters,
  filterSummaryChips,
  type PropertyFilters,
} from "@/lib/filters";
import { tabBarClearance } from "@/lib/layout";
import { LISTING_TYPES } from "@/lib/location";
import { colors, radius } from "@/lib/theme";
import type { PropertyListResponse } from "@/lib/types";

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    listingType?: string;
    province?: string;
    type?: string;
    district?: string;
  }>();
  const [filters, setFilters] = useState<PropertyFilters>({
    ...EMPTY_FILTERS,
    listingType: typeof params.listingType === "string" ? params.listingType : "",
    province: typeof params.province === "string" ? params.province : "",
    type: typeof params.type === "string" ? params.type : "",
    district: typeof params.district === "string" ? params.district : "",
  });
  const [searchText, setSearchText] = useState(filters.q);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      listingType: typeof params.listingType === "string" ? params.listingType : prev.listingType,
      province: typeof params.province === "string" ? params.province : prev.province,
    }));
  }, [params.listingType, params.province]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => (prev.q === searchText ? prev : { ...prev, q: searchText }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const queryString = useMemo(() => buildPropertyQuery(filters), [filters]);
  const activeCount = countSheetFilters(filters);
  const chips = filterSummaryChips(filters);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["properties", queryString],
    queryFn: () => api<PropertyListResponse>(`/properties?${queryString}`),
  });

  const properties = data?.data ?? [];

  function clearChip(key: keyof PropertyFilters) {
    setFilters((prev) => {
      const next = { ...prev, [key]: "" };
      if (key === "province") next.district = "";
      return next;
    });
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Explore</Text>
            <Text style={styles.sub}>Homes for sale and rent across Rwanda</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Search on map"
            onPress={() =>
              router.push({
                pathname: "/map",
                params: {
                  q: filters.q,
                  listingType: filters.listingType,
                  type: filters.type,
                  province: filters.province,
                  district: filters.district,
                  minPrice: filters.minPrice,
                  maxPrice: filters.maxPrice,
                  bedrooms: filters.bedrooms,
                  status: filters.status,
                },
              })
            }
            style={({ pressed }) => [styles.mapBtn, pressed && { opacity: 0.78 }]}
          >
            <Ionicons name="map-outline" size={18} color={colors.tealDeep} />
            <Text style={styles.mapBtnText}>Map</Text>
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}>
            <Input
              icon="search-outline"
              placeholder="Search area, landmark, keyword"
              value={searchText}
              onChangeText={setSearchText}
              returnKeyType="search"
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filters"
            onPress={() => setSheetOpen(true)}
            style={({ pressed }) => [styles.filterBtn, pressed && { opacity: 0.78 }]}
          >
            <Ionicons name="options-outline" size={20} color={colors.navy} />
            {activeCount ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <ChipRow
          variant="segment"
          value={filters.listingType}
          onChange={(listingType) => setFilters((prev) => ({ ...prev, listingType }))}
          options={LISTING_TYPES}
        />

        {chips.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {chips.map((chip) => (
              <Pressable
                key={chip.key}
                onPress={() => clearChip(chip.key)}
                style={styles.summaryChip}
              >
                <Text style={styles.summaryText}>{chip.label}</Text>
                <Ionicons name="close" size={14} color={colors.tealDeep} />
              </Pressable>
            ))}
            <Pressable
              onPress={() => {
                setSearchText("");
                setFilters(EMPTY_FILTERS);
              }}
              style={styles.clearAll}
            >
              <Text style={styles.clearAllText}>Clear all</Text>
            </Pressable>
          </ScrollView>
        ) : null}

        {data?.meta ? (
          <Text style={styles.count}>
            {data.meta.total} {data.meta.total === 1 ? "home" : "homes"}
            {activeCount ? " match your filters" : " listed"}
          </Text>
        ) : null}
      </View>

      {error ? (
        <EmptyState
          title="Could not load properties"
          subtitle="Check that the API is running, then pull to refresh."
          icon="cloud-offline-outline"
        />
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: tabBarClearance(insets.bottom) }]}
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.teal} />
          }
          ListEmptyComponent={
            isLoading ? (
              <Spinner />
            ) : (
              <EmptyState
                title="No matches"
                subtitle="Try clearing a filter or searching a different area."
                icon="search-outline"
              />
            )
          }
          renderItem={({ item }) => <PropertyCard property={item} />}
        />
      )}

      <FilterSheet
        visible={sheetOpen}
        value={filters}
        onClose={() => setSheetOpen(false)}
        onApply={(next) => {
          setFilters(next);
          setSearchText(next.q);
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.navy,
    letterSpacing: -0.4,
  },
  sub: {
    marginTop: 2,
    color: colors.muted,
    fontSize: 14,
  },
  mapBtn: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.tealSoft,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  mapBtnText: {
    color: colors.tealDeep,
    fontWeight: "700",
    fontSize: 13,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterBtn: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
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
  chipRow: {
    gap: 8,
    alignItems: "center",
    paddingRight: 8,
  },
  summaryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.tealSoft,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  summaryText: {
    color: colors.tealDeep,
    fontWeight: "700",
    fontSize: 12,
  },
  clearAll: {
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  clearAllText: {
    color: colors.muted,
    fontWeight: "700",
    fontSize: 12,
  },
  count: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: "700",
  },
  list: {
    padding: 16,
  },
});
