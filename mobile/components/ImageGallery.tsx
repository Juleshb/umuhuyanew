import { useCallback, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { mediaUrl } from "@/lib/api";
import { colors } from "@/lib/theme";
import type { PropertyImage } from "@/lib/types";

export function ImageGallery({
  images,
  title,
}: {
  images: PropertyImage[];
  title: string;
}) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const photos = images.filter((img) => img.url);
  const [index, setIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const pager = useRef<FlatList<PropertyImage>>(null);
  const viewer = useRef<FlatList<PropertyImage>>(null);
  const height = Math.round(width * 0.72);

  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const next = viewableItems[0]?.index;
    if (typeof next === "number") setIndex(next);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current;

  function goTo(next: number, animated = true) {
    setIndex(next);
    pager.current?.scrollToIndex({ index: next, animated });
    if (viewerOpen) {
      viewer.current?.scrollToIndex({ index: next, animated });
    }
  }

  function openViewer(start = index) {
    setIndex(start);
    setViewerOpen(true);
    requestAnimationFrame(() => {
      viewer.current?.scrollToIndex({ index: start, animated: false });
    });
  }

  const onPagerScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(event.nativeEvent.contentOffset.x / width);
      if (next !== index && next >= 0 && next < photos.length) setIndex(next);
    },
    [index, photos.length, width]
  );

  if (!photos.length) {
    return (
      <View style={[styles.hero, { width, height }]}>
        <Ionicons name="image-outline" size={36} color={colors.muted} />
        <Text style={styles.empty}>No photos yet</Text>
      </View>
    );
  }

  return (
    <View>
      <View>
        <FlatList
          ref={pager}
          data={photos}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onPagerScroll}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={viewConfig}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          renderItem={({ item, index: itemIndex }) => (
            <Pressable onPress={() => openViewer(itemIndex)}>
              <Image
                source={{ uri: mediaUrl(item.url) }}
                style={{ width, height }}
                contentFit="cover"
                accessibilityLabel={`${title} photo ${itemIndex + 1}`}
              />
            </Pressable>
          )}
        />

        <View style={styles.counter} pointerEvents="none">
          <Ionicons name="images-outline" size={14} color={colors.white} />
          <Text style={styles.counterText}>
            {index + 1} / {photos.length}
          </Text>
        </View>

        <Pressable style={styles.expand} onPress={() => openViewer(index)}>
          <Ionicons name="expand-outline" size={18} color={colors.white} />
          <Text style={styles.expandText}>View all photos</Text>
        </Pressable>
      </View>

      {photos.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbs}
        >
          {photos.map((item, i) => (
            <Pressable key={item.id} onPress={() => goTo(i)}>
              <Image
                source={{ uri: mediaUrl(item.url) }}
                style={[styles.thumb, i === index && styles.thumbActive]}
                contentFit="cover"
              />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <Modal visible={viewerOpen} animationType="fade" onRequestClose={() => setViewerOpen(false)}>
        <StatusBar style="light" />
        <View style={styles.viewer}>
          <View style={[styles.viewerBar, { paddingTop: insets.top + 8 }]}>
            <Pressable onPress={() => setViewerOpen(false)} style={styles.closeBtn} hitSlop={8}>
              <Ionicons name="close" size={26} color={colors.white} />
            </Pressable>
            <Text style={styles.viewerCount}>
              {index + 1} of {photos.length}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <FlatList
            ref={viewer}
            data={photos}
            keyExtractor={(item) => `full-${item.id}`}
            horizontal
            pagingEnabled
            initialScrollIndex={index}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onPagerScroll}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            onScrollToIndexFailed={({ index: failed }) => {
              setTimeout(() => viewer.current?.scrollToIndex({ index: failed, animated: false }), 50);
            }}
            renderItem={({ item }) => (
              <ScrollView
                style={{ width }}
                contentContainerStyle={styles.zoomPage}
                maximumZoomScale={3}
                minimumZoomScale={1}
                centerContent
                bouncesZoom
              >
                <Image
                  source={{ uri: mediaUrl(item.url) }}
                  style={{ width, height: width * 1.15 }}
                  contentFit="contain"
                />
              </ScrollView>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.mist,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  empty: {
    color: colors.muted,
    fontWeight: "600",
  },
  counter: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: "rgba(11,28,44,0.72)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  counterText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 12,
  },
  expand: {
    position: "absolute",
    left: 14,
    bottom: 14,
    backgroundColor: "rgba(11,28,44,0.72)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  expandText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 13,
  },
  thumbs: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: colors.white,
  },
  thumb: {
    width: 64,
    height: 52,
    borderRadius: 8,
    backgroundColor: colors.mist,
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbActive: {
    borderColor: colors.teal,
  },
  viewer: {
    flex: 1,
    backgroundColor: "#0b1c2c",
  },
  viewerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  viewerCount: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 16,
  },
  zoomPage: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
