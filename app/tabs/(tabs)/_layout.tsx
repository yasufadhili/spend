import React, { useState } from "react";
import Home from "@/assets/Icons/house-simple.svg";
import HomeFill from "@/assets/Icons/house-simple-fill.svg";
import Chart from "@/assets/Icons/chart-bar.svg";
import ChartFill from "@/assets/Icons/chart-bar-fill.svg";
import X from "@/assets/Icons/x.svg";
import Plus from "@/assets/Icons/plus.svg";
import { SvgProps } from "react-native-svg";
import { View, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { Modal, ModalBackdrop, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader } from "@/components/ui/modal";
import { Heading } from "@/components/ui/heading";
import { CloseIcon, Icon } from "@/components/ui/icon";
import { Button, ButtonText } from "@/components/ui/button";
import { FormControl, FormControlLabel, FormControlLabelText } from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import { Textarea, TextareaInput } from "@/components/ui/textarea";

/**
 * TODO
 * Improve the screen are as to scroll when the keyboard is opened in the modal, but without lighting the bottom tab
 */

type TabIconProps = {
  name: "home" | "chart" | "plus";
  active: boolean;
  size?: number;
  colour?: string;
};

export const TabIcon = ({ name, active, size = 24, colour = "#fff" }: TabIconProps) => {
  const iconProps: SvgProps = { width: size, height: size, fill: colour };

  switch (name) {
    case "home":
      return active ? <HomeFill {...iconProps} fill={"#fff"} /> : <Home {...iconProps} />;
    case "chart":
      return active ? <ChartFill {...iconProps} fill={"#fff"} /> : <Chart {...iconProps} />;
    case "plus":
      return <Plus {...iconProps} />;
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
          ${isMain ? "w-14 h-14 rounded-full bg-primary-900 items-center justify-center shadow-lg" : 
            `${isFocused ? "bg-transparent" : "bg-transparent"} p-2 rounded-full`}
        `}
      >
        <TabIcon name={iconName} active={isFocused} />
      </View>
    </TouchableOpacity>
  );
};

export default function TabLayout() {
  const [showModal, setShowModal] = useState(false);

  const [isInvalid, setIsInvalid] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const [amountValue, setAmountValue] = React.useState("")
  const [noteValue, setNoteValue] = React.useState("")
  const handleSubmit = () => {
    if (inputValue.length < 6) {
      setIsInvalid(true)
    } else {
      setIsInvalid(false)
    }
  }

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: useClientOnlyValue(false, true),
          tabBarStyle: {
            position: "absolute",
            bottom: 20,
            left: 20,
            right: 20,
            backgroundColor: "#1F2937",
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
                if (route.name === "add") {
                  setShowModal(true);
                  return;
                }

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

      <Modal size="md" isOpen={showModal} onClose={() => setShowModal(false)}>
        <ModalBackdrop />
        <ModalContent>

          <ModalHeader>
            <Heading size="lg">Add New Expenditure</Heading>
            <ModalCloseButton>
              <Icon
                as={CloseIcon}
                size="md"
                className="stroke-background-400 group-[:hover]/modal-close-button:stroke-background-700 group-[:active]/modal-close-button:stroke-background-900 group-[:focus-visible]/modal-close-button:stroke-background-900"
              />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody className="pt-4 pb-4">
            <FormControl
              isInvalid={isInvalid}
              size="md"
              isDisabled={false}
              isReadOnly={false}
              isRequired={false}
              className="gap-1"
            >
              <FormControlLabel>
                <FormControlLabelText>Item</FormControlLabelText>
              </FormControlLabel>
              <Input className="my-1" size={"md"}>
                <InputField
                  type="text"
                  value={inputValue}
                  onChangeText={(text) => setInputValue(text)}
                />
              </Input>

              <FormControlLabel>
                <FormControlLabelText>Amount</FormControlLabelText>
              </FormControlLabel>
              <Input className="my-1" size={"md"}>
                <InputField
                  type="text"
                  keyboardType="numeric"
                  value={amountValue}
                  onChangeText={(text) => setAmountValue(text)}
                />
              </Input>

              <FormControlLabel>
                <FormControlLabelText>Note</FormControlLabelText>
              </FormControlLabel>
              <Textarea className="my-1" size={"md"}>
                <TextareaInput
                  multiline
                  type="text"
                  value={noteValue}
                  onChangeText={(text) => setNoteValue(text)}
                />
              </Textarea>

            </FormControl>
          </ModalBody>
          <ModalFooter>
                <Button
                  variant="outline"
                  size="sm"
                  action="secondary"
                  className="mr-3"
                  onPress={() => setShowModal(false)}
                >
                  <ButtonText>Cancel</ButtonText>
                </Button>
                <Button
                  size="sm"
                  action="primary"
                  className="border-0"
                  onPress={() => {
                    // Handle form submission
                    setShowModal(false);
                  }}
                >
              <ButtonText>Save</ButtonText>
            </Button>
          </ModalFooter>


        </ModalContent>
      </Modal>
    </>
  );
}