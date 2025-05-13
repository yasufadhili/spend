import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { FlatList, View, Dimensions } from "react-native";
import { VictoryPie, VictoryLabel, VictoryLegend } from "victory-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMemo, useState } from "react";
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const Tab = createMaterialTopTabNavigator();

export default function HomeScreen() {
  return (
    <Box className="flex-1">
      <TabNav />
    </Box>
  );
}

const expenditures = [
  { id: '1', title: 'Coffee', amount: 3.5, time: '08:30', category: 'Food' },
  { id: '2', title: 'Groceries', amount: 22.4, time: '10:15', category: 'Groceries' },
  { id: '3', title: 'Transport', amount: 7.0, time: '12:00', category: 'Transport' },
  { id: '4', title: 'Lunch', amount: 12.0, time: '13:30', category: 'Food' },
  { id: '5', title: 'Snacks', amount: 2.5, time: '16:00', category: 'Food' },
];

const categoryColours = {
  Food: '#FF6384',
  Groceries: '#36A2EB',
  Transport: '#FFCE56',
  Other: '#9966FF',
};

const TabNav = () => {
  return <Tab.Navigator
    initialRouteName="daily"
    screenOptions={{
      tabBarActiveTintColor: "#ffffff",
      tabBarInactiveTintColor: '#666',
      tabBarStyle: {
        backgroundColor: '#000000',
        elevation: 5,
      },
      tabBarIndicatorStyle: {
        backgroundColor: '#ffffff',
        height: 2,
        borderRadius: 2,
      },
      tabBarLabelStyle: {
        fontFamily: 'SemiBold',
        fontSize: 14,
      },
    }}
  >
    <Tab.Screen name="daily" component={DailyTab} 
      options={{
        title: "Daily"
      }}
    />
    <Tab.Screen name="weekly" component={WeeklyTab}
      options={{
        title: "Weekly"
      }}
     />
    <Tab.Screen name="monthly" component={MonthlyTab} 
      options={{
        title: "Monthly"
      }}
    />
  </Tab.Navigator>
}

const DailyTab = () => {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Calculate total spent
  const total = useMemo(() => expenditures.reduce((sum, e) => sum + e.amount, 0), []);

  // Process data for the pie chart
  const chartData = useMemo(() => {
    const categoryTotals = {};
    
    // Calculate totals by category
    expenditures.forEach(({ amount, category }) => {
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    });
    
    // Format for Victory charts
    return Object.entries(categoryTotals).map(([category, amount]) => ({
      x: category,
      y: amount,
      label: `${((amount / total) * 100).toFixed(1)}%`,
      category
    }));
  }, [total]);

  // Legend data
  const legendData = useMemo(() => {
    return chartData.map(({ x, y }) => ({
      name: `${x}: £${y.toFixed(2)}`,
      symbol: { fill: categoryColours[x] || categoryColours.Other }
    }));
  }, [chartData]);

  // Handle pie slice selection
  const handleSlicePress = (props) => {
    const category = props.datum.category;
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  // Filter expenditures based on selected category
  const filteredExpenditures = useMemo(() => {
    if (!selectedCategory) return expenditures;
    return expenditures.filter(item => item.category === selectedCategory);
  }, [selectedCategory]);

  const renderItem = ({ item }) => (
    <Box className="flex-row justify-between items-center px-4 py-2 border-b border-gray-200">
      <Box>
        <Text className="text-base font-semibold">{item.title}</Text>
        <Text className="text-xs text-gray-500">{item.time} - {item.category}</Text>
      </Box>
      <Text className="text-base font-bold text-red-500">-£{item.amount.toFixed(2)}</Text>
    </Box>
  );

  const ListHeader = () => (
    <Box className="p-4 bg-white">
      <Text className="text-xl font-bold mb-2">Today's Summary</Text>
      
      {/* Chart container */}
      <Box className="items-center justify-center mb-4">
        <View style={{ height: 280, width: screenWidth - 40 }}>
          {/* Pie chart */}
          <VictoryPie
            data={chartData}
            width={screenWidth - 40}
            height={220}
            colorScale={chartData.map(({ x }) => categoryColours[x] || categoryColours.Other)}
            innerRadius={70}
            labelRadius={({ innerRadius }) => (innerRadius + 40)}
            style={{
              labels: { 
                fill: "white", 
                fontSize: 12, 
                fontWeight: "bold" 
              },
              data: {
                fillOpacity: ({ datum }) => selectedCategory === datum.category ? 1 : (selectedCategory ? 0.3 : 0.9),
                stroke: ({ datum }) => selectedCategory === datum.category ? "white" : "none",
                strokeWidth: 2
              }
            }}
            events={[{
              target: "data",
              eventHandlers: {
                onPress: () => ({
                  mutation: (props) => {
                    handleSlicePress(props);
                    return null;
                  }
                })
              }
            }]}
            animate={{
              duration: 500,
              easing: "bounce"
            }}
          />
          
          {/* Center label showing total */}
          <VictoryLabel
            textAnchor="middle"
            verticalAnchor="middle"
            x={screenWidth / 2 - 20}
            y={110}
            style={{ fontSize: 18, fontWeight: "bold" }}
            text={`£${total.toFixed(2)}`}
          />
          
          {/* Legend */}
          <VictoryLegend
            x={0}
            y={220}
            centerTitle
            orientation="horizontal"
            gutter={20}
            data={legendData}
            style={{ 
              labels: { fontSize: 10 },
              title: { fontSize: 14 }
            }}
          />
        </View>
      </Box>
      
      <Text className="text-center text-lg font-semibold text-gray-800 mb-2">
        {selectedCategory ? `${selectedCategory} Expenses: £${filteredExpenditures.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}` : 
        `Total Spent: £${total.toFixed(2)}`}
      </Text>
      
      {selectedCategory && (
        <Text 
          className="text-center text-sm text-blue-500 mb-2"
          onPress={() => setSelectedCategory(null)}
        >
          Tap to show all categories
        </Text>
      )}
    </Box>
  );

  return (
    <Box className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <FlatList
        data={filteredExpenditures}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </Box>
  );
}

const WeeklyTab = () => {
  return <Box className="flex-1 items-center justify-center">
    <Text className="text-lg">
      Weekly Summary Coming Soon
    </Text>
  </Box>
}

const MonthlyTab = () => {
  return <Box className="flex-1 items-center justify-center">
    <Text className="text-lg">
      Monthly Summary Coming Soon
    </Text>
  </Box>
}