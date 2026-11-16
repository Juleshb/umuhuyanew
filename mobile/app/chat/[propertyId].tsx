import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, EmptyState, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, radius } from "@/lib/theme";
import type { Inquiry, Property } from "@/lib/types";

function useKeyboardLift() {
  const [lift, setLift] = useState(0);
  const fullHeight = useRef(Dimensions.get("window").height);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, (event) => {
      const now = Dimensions.get("window").height;
      const alreadyResized = Math.max(0, fullHeight.current - now);
      setLift(Math.max(0, event.endCoordinates.height - alreadyResized));
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      fullHeight.current = Dimensions.get("window").height;
      setLift(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return lift;
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function InquiryChatScreen() {
  const { propertyId, buyerId } = useLocalSearchParams<{
    propertyId: string;
    buyerId?: string;
  }>();
  const insets = useSafeAreaInsets();
  const keyboardLift = useKeyboardLift();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const listRef = useRef<FlatList<Inquiry>>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const propertyQuery = useQuery({
    queryKey: ["property", propertyId],
    enabled: Boolean(propertyId),
    queryFn: () => api<{ data: Property }>(`/properties/${propertyId}`),
  });

  const inquiriesQuery = useQuery({
    queryKey: ["inquiries"],
    enabled: Boolean(user),
    queryFn: () => api<{ data: Inquiry[] }>("/inquiries"),
  });

  const send = useMutation({
    mutationFn: (message: string) =>
      api("/inquiries", {
        method: "POST",
        json: { propertyId, message },
      }),
    onSuccess: () => {
      setDraft("");
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["inquiries"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const property = propertyQuery.data?.data;
  const closed = property?.status === "SOLD" || property?.status === "RENTED";
  const isOwner = Boolean(user && property && user.id === property.agentId);
  const canSend = Boolean(user && property && !isOwner && !closed);

  const messages = useMemo(() => {
    const rows = inquiriesQuery.data?.data ?? [];
    return rows
      .filter((item) => {
        if (item.property.id !== propertyId) return false;
        if (buyerId && item.buyer.id !== buyerId) return false;
        if (!buyerId && user && user.id !== property?.agentId && item.buyer.id !== user.id) {
          return false;
        }
        return true;
      })
      .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  }, [buyerId, inquiriesQuery.data?.data, property?.agentId, propertyId, user]);

  useEffect(() => {
    if (!messages.length) return;
    const timer = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(timer);
  }, [messages.length, keyboardLift]);

  function onSend() {
    const message = draft.trim();
    if (!user) {
      router.push({ pathname: "/login", params: { next: `/chat/${propertyId}` } });
      return;
    }
    if (message.length < 5) {
      setError("Write at least 5 characters.");
      return;
    }
    send.mutate(message);
  }

  if (propertyQuery.isLoading || (user && inquiriesQuery.isLoading)) return <Spinner />;
  if (!property) {
    return <EmptyState title="Property not found" subtitle="This listing is no longer available." />;
  }

  const peerName = isOwner
    ? messages[0]?.buyer.name || "Buyer"
    : property.agent.name;

  return (
    <View style={[styles.screen, { paddingBottom: keyboardLift }]}>
      <Stack.Screen options={{ title: peerName }} />
      <View style={styles.topic}>
        <Text style={styles.topicTitle} numberOfLines={1}>
          {property.title}
        </Text>
        <Text style={styles.topicMeta}>
          {isOwner ? "Buyer messages" : `Chat with ${property.agent.name}`}
        </Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.thread}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Start the conversation</Text>
            <Text style={styles.emptyText}>
              Ask about a visit, the price, or anything else. The agent sees it in their inquiries.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const mine = item.buyer.id === user?.id;
          return (
            <View style={[styles.bubbleWrap, mine ? styles.mineWrap : styles.theirWrap]}>
              {!mine ? <Text style={styles.sender}>{item.buyer.name}</Text> : null}
              <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                <Text style={[styles.bubbleText, mine && styles.mineText]}>{item.message}</Text>
              </View>
              <Text style={styles.time}>{formatWhen(item.createdAt)}</Text>
            </View>
          );
        }}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {canSend ? (
        <View style={[styles.composer, { paddingBottom: keyboardLift > 0 ? 8 : Math.max(insets.bottom, 10) }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message…"
            placeholderTextColor={colors.muted}
            multiline
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            onPress={onSend}
            disabled={send.isPending}
            style={({ pressed }) => [styles.send, pressed && { opacity: 0.75 }]}
          >
            <Ionicons name="send" size={18} color={colors.white} />
          </Pressable>
        </View>
      ) : (
        <View style={[styles.closedBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {user ? (
            <Text style={styles.closedText}>
              {closed
                ? "This listing is no longer taking messages."
                : "You will see buyer messages here."}
            </Text>
          ) : (
            <Button
              title="Sign in to message"
              onPress={() =>
                router.push({ pathname: "/login", params: { next: `/chat/${propertyId}` } })
              }
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  topic: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  topicTitle: { fontSize: 15, fontWeight: "700", color: colors.navy },
  topicMeta: { marginTop: 2, fontSize: 12, color: colors.muted },
  thread: { padding: 16, gap: 12, flexGrow: 1 },
  empty: { paddingTop: 48, paddingHorizontal: 12, alignItems: "center", gap: 6 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.navy },
  emptyText: { textAlign: "center", color: colors.muted, lineHeight: 20 },
  bubbleWrap: { maxWidth: "82%", gap: 4 },
  mineWrap: { alignSelf: "flex-end", alignItems: "flex-end" },
  theirWrap: { alignSelf: "flex-start", alignItems: "flex-start" },
  sender: { fontSize: 11, fontWeight: "700", color: colors.muted, marginLeft: 4 },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  mine: { backgroundColor: colors.teal, borderBottomRightRadius: 6 },
  theirs: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: colors.line,
  },
  bubbleText: { fontSize: 15, lineHeight: 21, color: colors.ink },
  mineText: { color: colors.white },
  time: { fontSize: 11, color: colors.muted, marginHorizontal: 4 },
  error: { color: colors.danger, fontSize: 13, paddingHorizontal: 16, paddingBottom: 4 },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: radius.lg,
    backgroundColor: colors.canvas,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
    color: colors.ink,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  closedBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  closedText: { textAlign: "center", color: colors.muted, fontSize: 13 },
});
