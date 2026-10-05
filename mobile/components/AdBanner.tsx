import { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { mediaUrl } from "@/lib/api";
import { colors, radius } from "@/lib/theme";
import type { AdBanner as Banner } from "@/lib/types";

const IMAGE_HEIGHT = 176;
const SIDE = 16;

function openHref(href: string | null) {
  if (!href) return;
  if (/^https?:\/\//i.test(href)) {
    void Linking.openURL(href);
    return;
  }
  const [path, query] = href.split("?");
  if (query) {
    router.push({
      pathname: path as never,
      params: Object.fromEntries(new URLSearchParams(query)),
    });
    return;
  }
  router.push(href as never);
}

export function AdBanner({ banners }: { banners: Banner[] }) {
  const { width } = useWindowDimensions();
  const cardWidth = width - SIDE * 2;
  const listRef = useRef<FlatList<Banner>>(null);
  const indexRef = useRef(0);
  const pausedUntil = useRef(0);
  const [index, setIndex] = useState(0);

  const slides = useMemo(() => banners.filter((item) => item.imageUrl), [banners]);

  useEffect(() => {
    indexRef.current = 0;
    setIndex(0);
    if (slides.length) {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [slides.length, cardWidth]);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      const next = (indexRef.current + 1) % slides.length;
      indexRef.current = next;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setIndex(next);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length, cardWidth]);

  function onScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(event.nativeEvent.contentOffset.x / cardWidth);
    if (next >= 0 && next < slides.length) {
      indexRef.current = next;
      setIndex(next);
    }
  }

  if (!slides.length) return null;

  return (
    <View style={styles.wrap}>
      <View style={[styles.card, { width: cardWidth }]}>
        <FlatList
          ref={listRef}
          data={slides}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled
          directionalLockEnabled
          onScrollBeginDrag={() => {
            pausedUntil.current = Date.now() + 8000;
          }}
          onMomentumScrollEnd={onScrollEnd}
          getItemLayout={(_, i) => ({ length: cardWidth, offset: cardWidth * i, index: i })}
          onScrollToIndexFailed={({ index: failed }) => {
            setTimeout(() => listRef.current?.scrollToIndex({ index: failed, animated: false }), 80);
          }}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.kicker}. ${item.title}`}
              onPress={() => openHref(item.href)}
              style={[styles.slide, { width: cardWidth }]}
            >
              <Image source={{ uri: mediaUrl(item.imageUrl) }} style={styles.image} contentFit="cover" />
              <View style={styles.scrim} />
              <View style={styles.copy}>
                {item.kicker ? (
                  <View style={styles.kickerWrap}>
                    <Text style={styles.kicker}>{item.kicker}</Text>
                  </View>
                ) : null}
                <Text style={styles.title} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.subtitle ? (
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                ) : null}
                {item.ctaLabel ? (
                  <View style={styles.cta}>
                    <Text style={styles.ctaText}>{item.ctaLabel}</Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          )}
        />
      </View>
      {slides.length > 1 ? (
        <View style={styles.dots}>
          {slides.map((slide, i) => (
            <Pressable
              key={slide.id}
              accessibilityRole="button"
              onPress={() => {
                pausedUntil.current = Date.now() + 8000;
                indexRef.current = i;
                setIndex(i);
                listRef.current?.scrollToIndex({ index: i, animated: true });
              }}
              hitSlop={8}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: SIDE,
    paddingTop: 4,
    gap: 10,
  },
  card: {
    height: IMAGE_HEIGHT,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.navy,
    shadowColor: "#142022",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  slide: {
    height: IMAGE_HEIGHT,
    overflow: "hidden",
  },
  image: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.mist,
  },
  scrim: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 128,
    backgroundColor: "rgba(11,28,44,0.52)",
  },
  copy: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 14,
    gap: 3,
  },
  kickerWrap: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    marginBottom: 3,
  },
  kicker: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  subtitle: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
  },
  cta: {
    alignSelf: "flex-start",
    marginTop: 8,
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  ctaText: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: "700",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(20,32,34,0.18)",
  },
  dotActive: {
    width: 16,
    backgroundColor: colors.teal,
  },
});
