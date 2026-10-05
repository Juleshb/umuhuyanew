import { useEffect, useRef, useState, type ReactNode } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { SplashOverlay } from "@/components/SplashOverlay";
import { AuthProvider, useAuth } from "@/lib/auth";
import { QueryProvider } from "@/lib/query";
import { colors } from "@/lib/theme";

export {
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function AppShell({ children }: { children: ReactNode }) {
  const { loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const started = useRef(Date.now());

  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (loading) return;
    const wait = Math.max(700, 1600 - (Date.now() - started.current));
    const timer = setTimeout(() => setShowSplash(false), wait);
    return () => clearTimeout(timer);
  }, [loading]);

  return (
    <>
      {children}
      {showSplash ? <SplashOverlay /> : null}
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <AppShell>
          <Stack
            screenOptions={{
              headerShadowVisible: false,
              headerTintColor: colors.teal,
              headerTitleStyle: { color: colors.navy, fontWeight: "700" },
              headerStyle: { backgroundColor: colors.white },
              contentStyle: { backgroundColor: colors.canvas },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ title: "Log in", presentation: "modal" }} />
            <Stack.Screen name="register" options={{ title: "Create account" }} />
            <Stack.Screen name="property/[id]" options={{ title: "Property" }} />
            <Stack.Screen name="inquiries" options={{ title: "Inquiries" }} />
            <Stack.Screen name="listings" options={{ title: "My listings" }} />
            <Stack.Screen name="listing-new" options={{ title: "New listing" }} />
          </Stack>
        </AppShell>
      </AuthProvider>
    </QueryProvider>
  );
}
