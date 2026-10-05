export const TAB_BAR_HEIGHT = 58;

export function tabBarBottomOffset(insetBottom: number) {
  return Math.max(insetBottom, 8) + 6;
}

export function tabBarClearance(insetBottom: number) {
  return TAB_BAR_HEIGHT + tabBarBottomOffset(insetBottom) + 18;
}
