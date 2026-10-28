import type { ComponentProps } from "react";
import { Platform, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { NativeTabs } from "expo-router/native-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ANDROID_TAB_CONTENT_HEIGHT } from "@/lib/layout";
import { colors } from "@/lib/theme";

type IconName = ComponentProps<typeof Ionicons>["name"];

function AndroidTabIcon({
  focused,
  outline,
  filled,
  color,
}: {
  focused: boolean;
  outline: IconName;
  filled: IconName;
  color: string;
}) {
  return <Ionicons name={focused ? filled : outline} size={22} color={color} />;
}

function AndroidTabs() {
  const insets = useSafeAreaInsets();
  // Lift tab items above system nav / gesture bar on edge-to-edge Android
  const bottomPad = Math.max(insets.bottom, 10);
  const tabBarHeight = ANDROID_TAB_CONTENT_HEIGHT + bottomPad;

  return (
    <Tabs
      safeAreaInsets={{ bottom: 0, top: 0, left: 0, right: 0 }}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.line,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 8,
          height: tabBarHeight,
          paddingBottom: bottomPad,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, color }) => (
            <AndroidTabIcon focused={focused} color={color} outline="home-outline" filled="home" />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ focused, color }) => (
            <AndroidTabIcon focused={focused} color={color} outline="search-outline" filled="search" />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          tabBarIcon: ({ focused, color }) => (
            <AndroidTabIcon focused={focused} color={color} outline="heart-outline" filled="heart" />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ focused, color }) => (
            <AndroidTabIcon focused={focused} color={color} outline="person-outline" filled="person" />
          ),
        }}
      />
    </Tabs>
  );
}

function IOSNativeTabs() {
  return (
    <NativeTabs
      tintColor={colors.teal}
      iconColor={{
        default: "rgba(20,32,34,0.45)",
        selected: colors.teal,
      }}
      labelStyle={{
        default: { color: "rgba(20,32,34,0.45)", fontSize: 11, fontWeight: "600" },
        selected: { color: colors.teal, fontSize: 11, fontWeight: "700" },
      }}
      // Pre–iOS 26 fallback; ignored when system Liquid Glass draws the bar
      blurEffect="systemChromeMaterial"
      minimizeBehavior="automatic"
      disableTransparentOnScrollEdge={false}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "magnifyingglass", selected: "magnifyingglass" }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="saved">
        <NativeTabs.Trigger.Label>Saved</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "heart", selected: "heart.fill" }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="account">
        <NativeTabs.Trigger.Label>Account</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "person", selected: "person.fill" }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

export default function TabLayout() {
  if (Platform.OS === "ios") {
    return <IOSNativeTabs />;
  }
  return <AndroidTabs />;
}
