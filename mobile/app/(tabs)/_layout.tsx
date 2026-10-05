import { StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TAB_BAR_HEIGHT, tabBarBottomOffset } from "@/lib/layout";
import { colors } from "@/lib/theme";

function TabBarBackground() {
  return (
    <View style={styles.tabShell}>
      <BlurView intensity={64} tint="light" style={styles.blur} />
      <View style={styles.tabTint} />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottom = tabBarBottomOffset(insets.bottom);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: "rgba(20,32,34,0.38)",
        tabBarHideOnKeyboard: true,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom,
          height: TAB_BAR_HEIGHT,
          borderRadius: 20,
          backgroundColor: "transparent",
          borderTopWidth: 0,
          shadowColor: "#142022",
          shadowOpacity: 0.1,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        },
        tabBarItemStyle: {
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginBottom: 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "search" : "search-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "heart" : "heart-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabShell: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden",
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(20,32,34,0.08)",
  },
  blur: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  tabTint: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(255,255,255,0.82)",
  },
});
