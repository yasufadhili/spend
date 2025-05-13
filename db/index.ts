import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { categories, expenditures } from './schema';

let dbInstance: ReturnType<typeof openDatabaseSync> | null = null;

export const getDatabase = () => {
  if (!dbInstance) {
    dbInstance = openDatabaseSync('spend.db');
  }
  return dbInstance;
};

export const db = drizzle(getDatabase());

let isInitialized = false;

export async function initializeDatabase() {
  if (isInitialized) {
    return;
  }

  const tableStatements = [
    `CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS expenditures (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      category_id TEXT NOT NULL,
      date INTEGER NOT NULL,
      note TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    )`
  ];

  const database = getDatabase();
  
  try {
    for (const statement of tableStatements) {
      await database.execAsync(statement);
    }

    await seedInitialCategories();
    
    isInitialized = true;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

async function seedInitialCategories() {
  const defaultCategories = [
    { id: '1', name: 'Food', color: '#FF6384' },
    { id: '2', name: 'Groceries', color: '#36A2EB' },
    { id: '3', name: 'Transport', color: '#FFCE56' },
    { id: '4', name: 'Other', color: '#9966FF' }
  ];

  const database = getDatabase();
  
  try {
    const result = await database.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM categories');
    
    if (!result || result.count === 0) {
      await database.withTransactionAsync(async () => {
        for (const category of defaultCategories) {
          await database.runAsync(
            'INSERT INTO categories (id, name, color) VALUES (?, ?, ?)',
            [category.id, category.name, category.color]
          );
        }
      });
    }
  } catch (error) {
    console.error('Error seeding categories:', error);
    throw error;
  }
}

export const isDbInitialized = () => isInitialized;