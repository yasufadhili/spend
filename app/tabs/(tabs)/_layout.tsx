import React, { useState, useEffect } from "react";
import Home from "@/assets/Icons/house-simple.svg";
import HomeFill from "@/assets/Icons/house-simple-fill.svg";
import Chart from "@/assets/Icons/chart-bar.svg";
import ChartFill from "@/assets/Icons/chart-bar-fill.svg";
import SettingsIcon from "@/assets/Icons/gear-six.svg";
import Plus from "@/assets/Icons/plus.svg";
import { SvgProps } from "react-native-svg";
import { View, TouchableOpacity, Platform, Alert } from "react-native";
import { router, Stack, Tabs } from "expo-router";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { Modal, ModalBackdrop, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader } from "@/components/ui/modal";
import { Heading } from "@/components/ui/heading";
import { CloseIcon, Icon } from "@/components/ui/icon";
import { Button, ButtonText } from "@/components/ui/button";
import { FormControl, FormControlLabel, FormControlLabelText, FormControlHelper, FormControlHelperText, FormControlError, FormControlErrorText } from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { Pressable } from "@/components/ui/pressable";
import { Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop, SelectContent, SelectDragIndicatorWrapper, SelectDragIndicator, SelectItem } from "@/components/ui/select";
import { ChevronDownIcon } from "@/components/ui/icon";
import { useDb } from "@/db/context";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Text } from "@/components/ui/text";

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

export default function StackLayout () {

  return (
    <Stack
      screenOptions={{
        headerShown: useClientOnlyValue(false, true),
        headerTitleStyle: {
          fontFamily: "Bold",
          fontSize: 23
        },
        headerStyle: {
          backgroundColor: "#000000"
        },
        headerRight: ()=> <Pressable onPress={()=> router.navigate("/tabs/settings")} className="p-4">
          <SettingsIcon width={24} height={24} color={"#ffffff"} />
        </Pressable>,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Spend",
          headerTitleAlign: "left",
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          title: "Add",
        }}
      />
    </Stack>
  );
}

function TabLayout() {
  const { initialized, categories, addExpenditure } = useDb();
  
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [isTitleInvalid, setIsTitleInvalid] = useState(false);
  const [isAmountInvalid, setIsAmountInvalid] = useState(false);
  const [isCategoryInvalid, setIsCategoryInvalid] = useState(false);

  const resetForm = () => {
    setTitle("");
    setAmount("");
    setCategoryId("");
    setNote("");
    setDate(new Date());
    setIsTitleInvalid(false);
    setIsAmountInvalid(false);
    setIsCategoryInvalid(false);
  };

  const handleSave = async () => {
    // Validate inputs
    let isValid = true;
    
    if (!title.trim()) {
      setIsTitleInvalid(true);
      isValid = false;
    }
    
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      setIsAmountInvalid(true);
      isValid = false;
    }
    
    if (!categoryId) {
      setIsCategoryInvalid(true);
      isValid = false;
    }
    
    if (!isValid) return;
    
    try {
      if (!initialized) {
        Alert.alert("Error", "Database is not initialized yet. Please try again later.");
        return;
      }
      
      await addExpenditure(
        title.trim(),
        Number(amount),
        categoryId,
        date.getTime(),
        note.trim() || undefined
      );
      
      setShowModal(false);
      resetForm();
      
      // Success message
      Alert.alert("Success", "Expenditure added successfully");
    } catch (error) {
      console.error("Failed to add expenditure:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      Alert.alert("Error", `Failed to add expenditure: ${errorMessage}`);
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: useClientOnlyValue(false, true),
          headerTitleStyle: {
            fontFamily: "Bold",
            fontSize: 23
          },
          headerStyle: {
            backgroundColor: "#000000"
          },
          headerRight: ()=> <Pressable onPress={()=> router.navigate("/tabs/settings")} className="p-4">
            <SettingsIcon width={24} height={24} color={"#ffffff"} />
          </Pressable>,
          tabBarStyle: {
            backgroundColor: "#1F2937",
            borderRadius: 15,
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
                  if (initialized) {
                    setShowModal(true);
                  } else {
                    Alert.alert("Loading", "Database is still initializing. Please try again in a moment.");
                  }
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
        <Tabs.Screen name="index" options={{ title: "Spend", headerTitleAlign: "left" }} />
        <Tabs.Screen name="add" options={{ title: "Add" }} />
        <Tabs.Screen name="insights" options={{ title: "Insights" }} />
      </Tabs>

      <Modal size="md" isOpen={showModal} onClose={() => {
        setShowModal(false);
        resetForm();
      }}>
        <ModalBackdrop />
        <ModalContent>
          <ModalHeader>
            <Heading size="lg">Add New Expenditure</Heading>
            <ModalCloseButton onPress={() => {
              setShowModal(false);
              resetForm();
            }}>
              <Icon
                as={CloseIcon}
                size="md"
                className="stroke-background-400 group-[:hover]/modal-close-button:stroke-background-700 group-[:active]/modal-close-button:stroke-background-900 group-[:focus-visible]/modal-close-button:stroke-background-900"
              />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody className="pt-4 pb-4">
            <FormControl
              isInvalid={isTitleInvalid}
              size="md"
              isRequired={true}
              className="gap-1 mb-3"
            >
              <FormControlLabel>
                <FormControlLabelText>Title</FormControlLabelText>
              </FormControlLabel>
              <Input className="my-1" size={"md"}>
                <InputField
                  type="text"
                  value={title}
                  onChangeText={(text) => {
                    setTitle(text);
                    setIsTitleInvalid(false);
                  }}
                />
              </Input>
              {isTitleInvalid && (
                <FormControlError>
                  <FormControlErrorText>Title is required</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            <FormControl
              isInvalid={isAmountInvalid}
              size="md"
              isRequired={true}
              className="gap-1 mb-3"
            >
              <FormControlLabel>
                <FormControlLabelText>Amount</FormControlLabelText>
              </FormControlLabel>
              <Input className="my-1" size={"md"}>
                <InputField
                  type="text"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={(text) => {
                    setAmount(text);
                    setIsAmountInvalid(false);
                  }}
                />
              </Input>
              {isAmountInvalid && (
                <FormControlError>
                  <FormControlErrorText>Enter a valid amount</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            <FormControl
              isInvalid={isCategoryInvalid}
              size="md"
              isRequired={true}
              className="gap-1 mb-3"
            >
              <FormControlLabel>
                <FormControlLabelText>Category</FormControlLabelText>
              </FormControlLabel>
              <Select
                onValueChange={(value) => {
                  setCategoryId(value);
                  setIsCategoryInvalid(false);
                }}
                selectedValue={categoryId}
              >
                <SelectTrigger className="my-1" size={"md"}>
                  <SelectInput placeholder="Select a category" />
                  <SelectIcon>
                    <Icon as={ChevronDownIcon} />
                  </SelectIcon>
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper>
                      <SelectDragIndicator />
                    </SelectDragIndicatorWrapper>
                    {categories.map(category => (
                      <SelectItem 
                        key={category.id} 
                        label={category.name} 
                        value={category.id} 
                      />
                    ))}
                  </SelectContent>
                </SelectPortal>
              </Select>
              {isCategoryInvalid && (
                <FormControlError>
                  <FormControlErrorText>Select a category</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            <FormControl
              size="md"
              className="gap-1 mb-3"
            >
              <FormControlLabel>
                <FormControlLabelText>Date</FormControlLabelText>
              </FormControlLabel>
              <Pressable onPress={() => setShowDatePicker(true)} className="border border-gray-400 rounded-md p-3 my-1">
                <Text>{date.toLocaleDateString()}</Text>
              </Pressable>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={onChangeDate}
                />
              )}
            </FormControl>

            <FormControl
              size="md"
              className="gap-1"
            >
              <FormControlLabel>
                <FormControlLabelText>Note</FormControlLabelText>
              </FormControlLabel>
              <Textarea className="my-1" size={"md"}>
                <TextareaInput
                  multiline
                  type="text"
                  value={note}
                  onChangeText={(text) => setNote(text)}
                  textAlignVertical="top"
                  style={{ height: 100, textAlign: 'left' }}
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
              onPress={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button
              size="sm"
              action="primary"
              className="border-0"
              onPress={handleSave}
            >
              <ButtonText>Save</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}