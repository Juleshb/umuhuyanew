import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, EmptyState, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatLocation, formatPrice } from "@/lib/location";
import { colors, radius } from "@/lib/theme";
import type { Property, PropertyStatus } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  APPROVED: "Approved",
  PENDING: "Pending",
  DRAFT: "Draft",
  REJECTED: "Rejected",
  SOLD: "Sold",
  RENTED: "Rented",
};

const STATUS_TONE: Record<string, "teal" | "orange" | "navy" | "muted"> = {
  APPROVED: "teal",
  PENDING: "orange",
  DRAFT: "muted",
  REJECTED: "orange",
  SOLD: "navy",
  RENTED: "navy",
};

export default function ListingsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["agent-properties"],
    enabled: Boolean(user),
    queryFn: () => api<{ data: Property[] }>("/agent/properties"),
  });

  const submit = useMutation({
    mutationFn: (id: string) => api(`/properties/${id}/submit`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agent-properties"] }),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PropertyStatus }) =>
      api(`/properties/${id}/status`, { method: "PATCH", json: { status } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agent-properties"] }),
  });

  if (!user) return <EmptyState title="Log in to manage listings" />;
  if (isLoading) return <Spinner />;
  if (error) return <EmptyState title="Could not load listings" />;

  const listings = data?.data ?? [];

  return (
    <View style={styles.screen}>
      <View style={styles.top}>
        <Button title="New listing" onPress={() => router.push("/listing-new")} />
        {user.role === "AGENT" && !user.agentActive ? (
          <Text style={styles.warn}>
            Activate your agent account on the website (15,000 RWF / month) to post listings.
          </Text>
        ) : null}
      </View>
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
        }
        ListEmptyComponent={
          <EmptyState title="No listings yet" subtitle="Create a draft, add photos, then submit." />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/property/${item.id}`)}
            style={styles.card}
          >
            <View style={styles.row}>
              <Text style={styles.title}>{item.title}</Text>
              <Badge label={STATUS_LABEL[item.status] ?? item.status} tone={STATUS_TONE[item.status] ?? "muted"} />
            </View>
            <Text style={styles.meta}>{formatLocation(item)}</Text>
            <Text style={styles.price}>{formatPrice(item.price, item.currency)}</Text>
            {item.status === "DRAFT" ? (
              <Button
                title="Submit for approval"
                variant="secondary"
                loading={submit.isPending}
                onPress={() => submit.mutate(item.id)}
              />
            ) : null}
            {item.status === "APPROVED" ? (
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Button
                  title="Mark sold"
                  variant="ghost"
                  size="sm"
                  onPress={() => setStatus.mutate({ id: item.id, status: "SOLD" })}
                />
                <Button
                  title="Mark rented"
                  variant="ghost"
                  size="sm"
                  onPress={() => setStatus.mutate({ id: item.id, status: "RENTED" })}
                />
              </View>
            ) : null}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  top: { padding: 16, gap: 8, backgroundColor: colors.white },
  warn: { color: colors.orange, fontSize: 13, fontWeight: "600" },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 6,
  },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 8, alignItems: "center" },
  title: { flex: 1, fontSize: 16, fontWeight: "700", color: colors.navy },
  meta: { color: colors.muted, fontSize: 13 },
  price: { fontWeight: "700", color: colors.tealDeep },
});
