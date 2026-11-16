import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
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

  const threads = groupThreads(data?.data ?? [], isAgent);

  return (
    <FlatList
      data={threads}
      keyExtractor={(item) => item.key}
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
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/chat/[propertyId]",
                params: {
                  propertyId: item.propertyId,
                  ...(item.buyerId ? { buyerId: item.buyerId } : {}),
                },
              })
            }
          >
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>{item.location}</Text>
            {item.price != null ? (
              <Text style={styles.price}>{formatPrice(item.price, item.currency)}</Text>
            ) : null}
            <Text style={styles.message} numberOfLines={2}>
              {item.lastMessage}
            </Text>
            <Text style={styles.who}>
              {isAgent ? `From ${item.peerName}` : `To ${item.peerName}`} · {item.count}{" "}
              {item.count === 1 ? "message" : "messages"}
            </Text>
          </Pressable>
          {isAgent ? (
            <ChipRow
              value={item.status}
              onChange={(status) =>
                statusMutation.mutate({ id: item.latestId, status: status as InquiryStatus })
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

function groupThreads(inquiries: Inquiry[], isAgent: boolean) {
  const groups = new Map<string, Inquiry[]>();
  for (const item of inquiries) {
    const key = isAgent ? `${item.property.id}:${item.buyer.id}` : item.property.id;
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }

  return [...groups.entries()]
    .map(([key, items]) => {
      const sorted = [...items].sort(
        (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)
      );
      const last = sorted[sorted.length - 1];
      return {
        key,
        propertyId: last.property.id,
        buyerId: isAgent ? last.buyer.id : undefined,
        title: last.property.title,
        location: formatLocation(last.property),
        price: last.property.price,
        currency: last.property.currency,
        lastMessage: last.message,
        peerName: isAgent ? last.buyer.name : last.agent.name,
        status: last.status,
        latestId: last.id,
        count: sorted.length,
        updatedAt: last.createdAt,
      };
    })
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
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
