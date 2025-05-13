import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initializeDatabase, isDbInitialized } from './index';
import { categoryQueries, expenditureQueries, getExpendituresWithCategories } from './queries';
import { Category, Expenditure } from './schema';

type DbContextType = {
  initialized: boolean;
  categories: Category[];
  refreshTrigger: number;
  loadCategories: () => Promise<void>;
  getExpenditures: () => Promise<(Expenditure & { category: Category })[]>;
  getDailyExpenditures: (date?: Date) => Promise<Expenditure[]>;
  getWeeklyExpenditures: (date?: Date) => Promise<Expenditure[]>;
  getMonthlyExpenditures: (date?: Date) => Promise<Expenditure[]>;
  addExpenditure: (title: string, amount: number, categoryId: string, date: number, note?: string) => Promise<Expenditure>;
  updateExpenditure: (id: string, data: Partial<Expenditure>) => Promise<void>;
  deleteExpenditure: (id: string) => Promise<void>;
  addCategory: (name: string, color: string) => Promise<Category>;
  triggerRefresh: () => void;
};

const DbContext = createContext<DbContextType>({
  initialized: false,
  categories: [],
  refreshTrigger: 0,
  loadCategories: async () => {},
  getExpenditures: async () => [],
  getDailyExpenditures: async () => [],
  getWeeklyExpenditures: async () => [],
  getMonthlyExpenditures: async () => [],
  addExpenditure: async () => ({} as Expenditure),
  updateExpenditure: async () => {},
  deleteExpenditure: async () => {},
  addCategory: async () => ({} as Category),
  triggerRefresh: () => {},
});

export const DbProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [initialized, setInitialized] = useState(isDbInitialized());
  const [categories, setCategories] = useState<Category[]>([]);
  const [initializationInProgress, setInitializationInProgress] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const init = async () => {
      if (initialized || initializationInProgress) return;
      
      try {
        setInitializationInProgress(true);
        await initializeDatabase();
        await loadCategories();
        setInitialized(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
      } finally {
        setInitializationInProgress(false);
      }
    };
    
    init();
  }, [initialized, initializationInProgress]);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const loadCategories = async () => {
    try {
      const allCategories = await categoryQueries.getAll();
      setCategories(allCategories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const getExpenditures = async () => {
    if (!initialized) {
      console.warn('Attempted to get expenditures before database initialization');
      return [];
    }
    return await getExpendituresWithCategories();
  };

  const getDailyExpenditures = async (date: Date = new Date()) => {
    if (!initialized) {
      console.warn('Attempted to get daily expenditures before database initialization');
      return [];
    }
    return await expenditureQueries.getDaily(date);
  };

  const getWeeklyExpenditures = async (date: Date = new Date()) => {
    if (!initialized) {
      console.warn('Attempted to get weekly expenditures before database initialization');
      return [];
    }
    return await expenditureQueries.getWeekly(date);
  };

  const getMonthlyExpenditures = async (date: Date = new Date()) => {
    if (!initialized) {
      console.warn('Attempted to get monthly expenditures before database initialization');
      return [];
    }
    return await expenditureQueries.getMonthly(date);
  };

  const addExpenditure = async (
    title: string, 
    amount: number, 
    categoryId: string, 
    date: number, 
    note?: string
  ) => {
    if (!initialized) {
      throw new Error('Cannot add expenditure before database initialization');
    }
    
    const result = await expenditureQueries.create({
      title,
      amount,
      categoryId,
      date,
      note
    });
    
    triggerRefresh();
    
    return result;
  };

  const updateExpenditure = async (id: string, data: Partial<Expenditure>) => {
    if (!initialized) {
      throw new Error('Cannot update expenditure before database initialization');
    }
    await expenditureQueries.update(id, data);
    triggerRefresh();
  };

  const deleteExpenditure = async (id: string) => {
    if (!initialized) {
      throw new Error('Cannot delete expenditure before database initialization');
    }
    await expenditureQueries.delete(id);
    triggerRefresh();
  };

  const addCategory = async (name: string, color: string) => {
    if (!initialized) {
      throw new Error('Cannot add category before database initialization');
    }
    const newCategory = await categoryQueries.create({ name, color });
    await loadCategories();
    return newCategory;
  };
  
  return (
    <DbContext.Provider value={{
      initialized,
      categories,
      refreshTrigger,
      loadCategories,
      getExpenditures,
      getDailyExpenditures,
      getWeeklyExpenditures,
      getMonthlyExpenditures,
      addExpenditure,
      updateExpenditure,
      deleteExpenditure,
      addCategory,
      triggerRefresh,
    }}>
      {children}
    </DbContext.Provider>
  );
};

export const useDb = () => {
  const context = useContext(DbContext);
  if (!context) throw new Error('useDb must be used within a DbProvider');
  return context;
};
