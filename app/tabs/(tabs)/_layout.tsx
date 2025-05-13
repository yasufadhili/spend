import React from "react";
import Home from "@/assets/Icons/house-simple.svg";
import HomeFill from "@/assets/Icons/house-simple-fill.svg";
import Chart from "@/assets/Icons/chart-bar.svg";
import ChartFill from "@/assets/Icons/chart-bar-fill.svg";
import Plus from "@/assets/Icons/plus.svg";
import { SvgProps } from "react-native-svg";
import { View, TouchableOpacity } from "react-native";
import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";


type TabIconProps = {
  name: "home" | "chart" | "plus";
  active: boolean;
  size?: number;
};

export const TabIcon = ({ name, active, size = 24 }: TabIconProps) => {
  const iconProps: SvgProps = { width: size, height: size };

  switch (name) {
    case "home":
      return active ? <HomeFill {...iconProps} /> : <Home {...iconProps} />;
    case "chart":
      return active ? <ChartFill {...iconProps} /> : <Chart {...iconProps} />;
    case "plus":
      return <Plus {...iconProps} />; // No variant
    default:
      return null;
  }
};

type TabButtonProps = {
  iconName: "home" | "chart" | "plus";
  isFocused: boolean;
  onPress: () => void;
  isMain?: boolean;
};

const TabButton = ({ iconName, isFocused, onPress, isMain = false }: TabButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`items-center justify-center ${isMain ? "relative -top-6" : ""}`}
      accessibilityRole="button"
      accessibilityLabel={`${iconName} tab`}
      activeOpacity={0.85}
    >
      <View
        className={`
          ${isMain ? "w-14 h-14 rounded-full bg-indigo-600 items-center justify-center shadow-lg" : 
            `${isFocused ? "bg-gray-800" : "bg-transparent"} p-2 rounded-full`}
        `}
      >
        <TabIcon name={iconName} active={isFocused} />
      </View>
    </TouchableOpacity>
  );
};

export default function TabLayout() {
  const isDarkMode = useColorScheme() === "dark";

  return (
    <Tabs
      screenOptions={{
        headerShown: useClientOnlyValue(false, true),
        tabBarStyle: {
          position: "absolute",
          bottom: 20,
          left: 20,
          right: 20,
          backgroundColor: isDarkMode ? "#1F2937" : "#1A202C",
          borderRadius: 15,
          height: 70,
          borderTopWidth: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 3.5,
        },
        tabBarShowLabel: false,
      }}
      tabBar={({ navigation, state }) => (
        <View className="flex-row justify-around items-center absolute bottom-5 left-5 right-5 bg-gray-900 rounded-2xl h-16 px-2 shadow-md">
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const tabMap = {
              index: "home",
              insights: "chart",
              add: "plus",
            } as const;

            const iconName = tabMap[route.name as keyof typeof tabMap] || "home";
            const isMain = route.name === "add";

            return (
              <TabButton
                key={index}
                iconName={iconName}
                isFocused={isFocused}
                onPress={onPress}
                isMain={isMain}
              />
            );
          })}
        </View>
      )}
    >
      <Tabs.Screen name="index" options={{ title: "Home", headerTitleAlign: "left" }} />
      <Tabs.Screen name="add" options={{ title: "Add Transaction" }} />
      <Tabs.Screen name="insights" options={{ title: "Insights" }} />
    </Tabs>
  );
}
