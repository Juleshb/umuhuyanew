import { Platform } from "react-native";

/** Icon + label area on Android (safe-area padding added separately). */
export const ANDROID_TAB_CONTENT_HEIGHT = 56;

export const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 49 : ANDROID_TAB_CONTENT_HEIGHT;

export function tabBarBottomOffset(_insetBottom: number) {
  return 0;
}

export function tabBarClearance(insetBottom: number) {
  // iOS NativeTabs already apply system content insets for the liquid-glass bar.
  if (Platform.OS === "ios") {
    return 20;
  }
  const bottomPad = Math.max(insetBottom, 10);
  return ANDROID_TAB_CONTENT_HEIGHT + bottomPad + 12;
}
