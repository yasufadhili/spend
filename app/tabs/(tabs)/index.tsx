import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { FlatList, View, Dimensions, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { Pie, PolarChart } from "victory-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMemo, useState, useEffect, useCallback } from "react";
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useDb } from "@/db/context";
import { Expenditure, Category } from "@/db/schema";
import { formatCurrency } from "@/utils/formatters";

const Tab = createMaterialTopTabNavigator();

export default function HomeScreen() {
  return (
    <Box className="flex-1">
      <TabNav />
    </Box>
  );
}

const categoryColours: Record<string, string> = {
  // Default colours, will be overridden by actual category colors from DB
  default: '#9966FF',
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
        height: 48,
      },
      tabBarIndicatorStyle: {
        backgroundColor: '#ffffff',
        height: 2,
        borderRadius: 2,
      },
      tabBarLabelStyle: {
        fontFamily: 'SemiBold',
        fontSize: 14,
        marginTop: 0,
        marginBottom: 0,
      },
      tabBarContentContainerStyle: {
        alignItems: 'center',
      }
    }}
  >
    <Tab.Screen 
      name="daily" 
      component={DailyTab} 
      options={{
        title: "Daily"
      }}
    />
    <Tab.Screen 
      name="weekly" 
      component={WeeklyTab}
      options={{
        title: "Weekly"
      }}
    />
    <Tab.Screen 
      name="monthly" 
      component={MonthlyTab} 
      options={{
        title: "Monthly"
      }}
    />
  </Tab.Navigator>
}

type ExpenditureWithCategory = Expenditure & { category: Category };

const DailyTab = () => {
  const insets = useSafeAreaInsets();
  const { initialized, categories, getDailyExpenditures, refreshTrigger } = useDb();
  const [expenditures, setExpenditures] = useState<ExpenditureWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Load expenditures from database
  const loadExpenditures = useCallback(async () => {
    if (!initialized) return;
    
    try {
      setLoading(true);
      const dailyExpenses = await getDailyExpenditures(selectedDate);
      
      // Map category objects to expenditures
      const expensesWithCategories = dailyExpenses.map(expense => {
        const category = categories.find(c => c.id === expense.categoryId);
        return {
          ...expense,
          category: category || { id: 'unknown', name: 'Unknown', color: '#888888' }
        };
      });
      
      setExpenditures(expensesWithCategories);
    } catch (error) {
      console.error("Failed to load daily expenditures:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [initialized, selectedDate, categories, getDailyExpenditures]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadExpenditures();
  }, [loadExpenditures]);
  
  useEffect(() => {
    loadExpenditures();
  }, [loadExpenditures, refreshTrigger]);

  useEffect(() => {
    categories.forEach(category => {
      categoryColours[category.id] = category.color;
    });
  }, [categories]);

  const total = useMemo(() => 
    expenditures.reduce((sum, e) => sum + e.amount, 0), 
    [expenditures]
  );

  const chartData = useMemo(() => {
    const categoryTotals: { [key: string]: number } = {};
    
    expenditures.forEach(({ amount, categoryId }) => {
      categoryTotals[categoryId] = (categoryTotals[categoryId] || 0) + amount;
    });
    
    return Object.entries(categoryTotals).map(([categoryId, amount]) => {
      const category = categories.find(c => c.id === categoryId);
      return {
        x: category?.name || 'Unknown',
        y: amount,
        label: `${((amount / total) * 100).toFixed(1)}%`,
        categoryId
      };
    });
  }, [expenditures, total, categories]);

  const legendData = useMemo(() => {
    return chartData.map(({ x, y, categoryId }) => ({
      name: `${x}: UGX ${y.toFixed(2)}`,
      symbol: { fill: getCategoryColor(categoryId) }
    }));
  }, [chartData]);

  function getCategoryColor(categoryId: string): string {
    const category = categories.find(c => c.id === categoryId);
    return category?.color || categoryColours.default;
  }

  const handleSlicePress = (categoryId: string) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  const filteredExpenditures = useMemo(() => {
    if (!selectedCategory) return expenditures;
    return expenditures.filter(item => item.categoryId === selectedCategory);
  }, [expenditures, selectedCategory]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }: { item: ExpenditureWithCategory }) => (
    <Box className="flex-row justify-between items-center px-4 py-3 border-b">
      <Box>
        <Text className="text-base font-semibold">{item.title}</Text>
        <Text className="text-xs text-gray-500">
          {formatTime(item.date)} - {item.category.name}
        </Text>
      </Box>
      <Text className="text-base font-bold text-red-500">
        -UGX {item.amount.toFixed(2)}
      </Text>
    </Box>
  );

  const ListHeader = () => (
    <Box className="pb-4 px-4">
      <Text className="text-xl font-bold mb-4">Today's Summary</Text>
      
      {loading && !refreshing ? (
        <Box className="items-center justify-center py-10">
          <ActivityIndicator size="large" color="#0000ff" />
        </Box>
      ) : expenditures.length === 0 ? (
        <Box className="items-center justify-center py-10">
          <Text className="text-gray-500">No expenditures today</Text>
        </Box>
      ) : (
        <>
          {/* Chart and legend in horizontal layout */}
          {chartData.length > 0 ? (
            <Box className="flex-row justify-between items-center mb-4">
              <Box className="w-[50%] h-[200px] justify-center items-center">
                <Pie.Chart
                  data={chartData}
                  x="x"
                  y="y"
                  width={180}
                  height={180}
                  padding={0}
                  innerRadius={30}
                  labelRadius={60}
                  colorScale={chartData.map(item => getCategoryColor(item.categoryId))}
                  style={{
                    labels: {
                      fontSize: 10,
                      fill: 'white'
                    }
                  }}
                  events={[{
                    target: "data",
                    eventHandlers: {
                      onPress: () => {
                        return [{
                          target: "data",
                          mutation: (props) => {
                            handleSlicePress(props.datum.categoryId);
                            return null;
                          }
                        }];
                      }
                    }
                  }]}
                />
              </Box>
              <Box className="w-[50%] pl-2">
                {legendData.map((item, index) => (
                  <Box key={index} className="flex-row items-center mb-2">
                    <Box 
                      style={{ backgroundColor: item.symbol.fill }} 
                      className="w-4 h-4 mr-2 rounded-full" 
                    />
                    <Text className="text-xs">{item.name}</Text>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <Box className="items-center justify-center py-5">
              <Text className="text-gray-500">No data to display chart</Text>
            </Box>
          )}
          
          {/* Category selection indicator */}
          <Box className="bg-primary-400 rounded-lg p-3 mb-3">
            <Text className="text-center text-base font-semibold text-gray-800">
              {selectedCategory 
                ? `${categories.find(c => c.id === selectedCategory)?.name || 'Unknown'} Expenses: UGX ${filteredExpenditures.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}` 
                : `Total Spent: UGX ${total.toFixed(2)}`}
            </Text>
            
            {selectedCategory && (
              <Text 
                className="text-center text-sm text-blue-500 mt-1"
                onPress={() => setSelectedCategory(null)}
              >
                Tap to show all categories
              </Text>
            )}
          </Box>
        </>
      )}
      
      {/* List header */}
      <Box className="flex-row justify-between py-2">
        <Text className="font-bold text-gray-600">Transaction</Text>
        <Text className="font-bold text-gray-600">Amount</Text>
      </Box>
    </Box>
  );

  return (
    <Box className="flex-1" style={{ paddingTop: 0 }}>
      <FlatList
        data={filteredExpenditures}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0000ff']}
            tintColor={'#0000ff'}
          />
        }
      />
    </Box>
  );
};

const WeeklyTab = () => {
  const insets = useSafeAreaInsets();
  const { initialized, categories, getWeeklyExpenditures } = useDb();
  const [expenditures, setExpenditures] = useState<ExpenditureWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized) return;

    const loadExpenditures = async () => {
      try {
        setLoading(true);
        // Start with Monday as first day of the week
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        
        const monday = new Date(today);
        monday.setDate(today.getDate() + mondayOffset);
        monday.setHours(0, 0, 0, 0);
        
        const weeklyExpenses = await getWeeklyExpenditures(monday);
        
        // Map category objects to expenditures
        const expensesWithCategories = weeklyExpenses.map(expense => {
          const category = categories.find(c => c.id === expense.categoryId);
          return {
            ...expense,
            category: category || { id: 'unknown', name: 'Unknown', color: '#888888' }
          };
        });
        
        setExpenditures(expensesWithCategories);
      } catch (error) {
        console.error("Failed to load weekly expenditures:", error);
      } finally {
        setLoading(false);
      }
    };

    loadExpenditures();
  }, [initialized, categories]);

  return loading ? (
    <Box className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color="#0000ff" />
    </Box>
  ) : (
    <Box className="flex-1 items-center justify-center">
      <Text className="text-lg">
        {expenditures.length === 0 
          ? "No expenditures this week" 
          : `Weekly Total: UGX ${expenditures.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}`}
      </Text>
      {/* TODO Implementation of weekly summary similar to daily tab */}
    </Box>
  );
};

const MonthlyTab = () => {
  const insets = useSafeAreaInsets();
  const { initialized, categories, getMonthlyExpenditures } = useDb();
  const [expenditures, setExpenditures] = useState<ExpenditureWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized) return;

    const loadExpenditures = async () => {
      try {
        setLoading(true);
        const today = new Date();
        const monthlyExpenses = await getMonthlyExpenditures(today);
        
        const expensesWithCategories = monthlyExpenses.map(expense => {
          const category = categories.find(c => c.id === expense.categoryId);
          return {
            ...expense,
            category: category || { id: 'unknown', name: 'Unknown', color: '#888888' }
          };
        });
        
        setExpenditures(expensesWithCategories);
      } catch (error) {
        console.error("Failed to load monthly expenditures:", error);
      } finally {
        setLoading(false);
      }
    };

    loadExpenditures();
  }, [initialized, categories]);

  // Similar rendering logic as DailyTab, but with monthly data
  return loading ? (
    <Box className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color="#0000ff" />
    </Box>
  ) : (
    <Box className="flex-1 items-center justify-center">
      <Text className="text-lg">
        {expenditures.length === 0 
          ? "No expenditures this month" 
          : `Monthly Total: UGX ${expenditures.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}`}
      </Text>
      {/* TODO Implementation of monthly summary similar to daily tab */}
    </Box>
  );
};