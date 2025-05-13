import { eq, and, between, desc } from 'drizzle-orm';
import { db } from './index';
import { categories, expenditures, Category, NewCategory, Expenditure, NewExpenditure } from './schema';

export const generateId = () => Math.random().toString(36).substring(2, 15);

export const categoryQueries = {
  getAll: async (): Promise<Category[]> => {
    return await db.select().from(categories);
  },

  getById: async (id: string): Promise<Category | undefined> => {
    const results = await db.select().from(categories).where(eq(categories.id, id));
    return results[0];
  },

  create: async (category: Omit<NewCategory, 'id'>): Promise<Category> => {
    const newCategory = { id: generateId(), ...category };
    await db.insert(categories).values(newCategory);
    return newCategory as Category;
  },

  update: async (id: string, category: Partial<Omit<NewCategory, 'id'>>): Promise<void> => {
    await db.update(categories).set(category).where(eq(categories.id, id));
  },

  delete: async (id: string): Promise<void> => {
    await db.delete(categories).where(eq(categories.id, id));
  }
};


export const expenditureQueries = {
  
  getAll: async (): Promise<Expenditure[]> => {
    return await db.select().from(expenditures).orderBy(desc(expenditures.date));
  },

  getById: async (id: string): Promise<Expenditure | undefined> => {
    const results = await db.select().from(expenditures).where(eq(expenditures.id, id));
    return results[0];
  },

  getByCategory: async (categoryId: string): Promise<Expenditure[]> => {
    return await db.select()
      .from(expenditures)
      .where(eq(expenditures.categoryId, categoryId))
      .orderBy(desc(expenditures.date));
  },

  getByDateRange: async (startDate: number, endDate: number): Promise<Expenditure[]> => {
    return await db.select()
      .from(expenditures)
      .where(between(expenditures.date, startDate, endDate))
      .orderBy(desc(expenditures.date));
  },

  create: async (expenditure: Omit<NewExpenditure, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expenditure> => {
    const now = Date.now();
    const newExpenditure = {
      id: generateId(),
      ...expenditure,
      createdAt: now,
      updatedAt: now
    };
    
    await db.insert(expenditures).values(newExpenditure);
    return newExpenditure as Expenditure;
  },

  update: async (id: string, expenditure: Partial<Omit<NewExpenditure, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
    const now = Date.now();
    await db.update(expenditures)
      .set({ ...expenditure, updatedAt: now })
      .where(eq(expenditures.id, id));
  },

  delete: async (id: string): Promise<void> => {
    await db.delete(expenditures).where(eq(expenditures.id, id));
  },

  getDaily: async (date: Date): Promise<Expenditure[]> => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return await expenditureQueries.getByDateRange(startOfDay.getTime(), endOfDay.getTime());
  },

  getWeekly: async (date: Date): Promise<Expenditure[]> => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - (date.getDay() === 0 ? 6 : date.getDay() - 1)); // Start from Monday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End on Sunday
    endOfWeek.setHours(23, 59, 59, 999);
    
    return await expenditureQueries.getByDateRange(startOfWeek.getTime(), endOfWeek.getTime());
  },

  getMonthly: async (date: Date): Promise<Expenditure[]> => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    
    return await expenditureQueries.getByDateRange(startOfMonth.getTime(), endOfMonth.getTime());
  }
};

// Join operation to get expenditures with categories
export const getExpendituresWithCategories = async (): Promise<(Expenditure & { category: Category })[]> => {
  // Simple implementation as Drizzle doesn't have a built-in join mechanism in the same way
  const allExpenditures = await expenditureQueries.getAll();
  const allCategories = await categoryQueries.getAll();
  
  const categoriesMap = new Map<string, Category>();
  allCategories.forEach(category => categoriesMap.set(category.id, category));
  
  return allExpenditures.map(expenditure => ({
    ...expenditure,
    category: categoriesMap.get(expenditure.categoryId)!
  }));
};