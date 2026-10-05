import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PropertyCard } from "@/components/PropertyCard";
import { Button, EmptyState, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { tabBarClearance } from "@/lib/layout";
import { colors } from "@/lib/theme";
import type { FavoriteItem } from "@/lib/types";

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const { user, loading } = useAuth();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["favorites"],
    enabled: Boolean(user),
    queryFn: () => api<{ data: FavoriteItem[] }>("/favorites"),
  });

  if (loading) return <Spinner />;

  if (!user) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top, paddingBottom: tabBarClearance(insets.bottom) }]}>
        <Text style={styles.title}>Saved homes</Text>
        <Text style={styles.sub}>Log in to keep properties you like and come back later.</Text>
        <Button title="Log in" onPress={() => router.push("/login")} />
      </View>
    );
  }

  const favorites = data?.data ?? [];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved</Text>
        <Text style={styles.sub}>
          {favorites.length} {favorites.length === 1 ? "home" : "homes"} you have favorited
        </Text>
      </View>
      <FlatList
        data={favorites}
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
              title="Nothing saved yet"
              subtitle="Tap Save on a listing to keep it here."
              icon="heart-outline"
            />
          )
        }
        renderItem={({ item }) => <PropertyCard property={item.property} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  center: {
    padding: 28,
    gap: 12,
    justifyContent: "center",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.navy,
    letterSpacing: -0.4,
  },
  sub: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  list: {
    padding: 16,
  },
});
