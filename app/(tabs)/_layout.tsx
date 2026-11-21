import React from "react";
import { Tabs } from "expo-router";
import { GlassTabBar } from "../../src/components/glass/GlassTabBar";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" }
      }}
      tabBar={(props) => (
        <GlassTabBar
          activeTab={props.state.routes[props.state.index]?.name ?? "index"}
          onSelect={(name) => {
            const route = props.state.routes.find((r) => r.name === name);
            if (route) props.navigation.navigate(route.name as never);
          }}
        />
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="registry" />
      <Tabs.Screen name="files" />
      <Tabs.Screen name="git" />
      <Tabs.Screen name="account" />
    </Tabs>
  );
}
