import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChipRow } from "@/components/ChipRow";
import { EmptyState, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatLocation, formatPrice } from "@/lib/location";
import { colors, radius } from "@/lib/theme";
import type { Inquiry, InquiryStatus } from "@/lib/types";

export default function InquiriesScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAgent = user?.role === "AGENT" || user?.role === "ADMIN";

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["inquiries"],
    enabled: Boolean(user),
    queryFn: () => api<{ data: Inquiry[] }>("/inquiries"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: InquiryStatus }) =>
      api(`/inquiries/${id}/status`, { method: "PATCH", json: { status } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inquiries"] }),
  });

  if (!user) {
    return <EmptyState title="Log in to see inquiries" />;
  }

  if (isLoading) return <Spinner />;
  if (error) return <EmptyState title="Could not load inquiries" />;

  const inquiries = data?.data ?? [];

  return (
    <FlatList
      data={inquiries}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
      }
      ListEmptyComponent={
        <EmptyState
          title="No inquiries yet"
          subtitle={
            isAgent
              ? "Leads from buyers will show up here."
              : "Messages you send to agents will appear here."
          }
        />
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{item.property.title}</Text>
          <Text style={styles.meta}>{formatLocation(item.property)}</Text>
          {item.property.price != null ? (
            <Text style={styles.price}>
              {formatPrice(item.property.price, item.property.currency)}
            </Text>
          ) : null}
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.who}>
            {isAgent ? `From ${item.buyer.name}` : `To ${item.agent.name}`} · {item.status}
          </Text>
          {isAgent ? (
            <ChipRow
              value={item.status}
              onChange={(status) =>
                statusMutation.mutate({ id: item.id, status: status as InquiryStatus })
              }
              options={[
                { value: "NEW", label: "New" },
                { value: "READ", label: "Read" },
                { value: "REPLIED", label: "Replied" },
              ]}
            />
          ) : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 12, paddingBottom: 40, backgroundColor: colors.canvas },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 6,
  },
  title: { fontSize: 16, fontWeight: "700", color: colors.navy },
  meta: { color: colors.muted, fontSize: 13 },
  price: { fontWeight: "700", color: colors.tealDeep },
  message: { fontSize: 15, color: colors.ink, lineHeight: 21, marginTop: 4 },
  who: { fontSize: 12, color: colors.muted, fontWeight: "600" },
});
