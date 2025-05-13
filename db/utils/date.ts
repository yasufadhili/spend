// app/lib/utils/date.ts
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatFullDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString([], { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

export const getStartOfDay = (date: Date = new Date()): number => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay.getTime();
};

export const getEndOfDay = (date: Date = new Date()): number => {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay.getTime();
};

export const getStartOfWeek = (date: Date = new Date()): number => {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay()); // Start from Sunday
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek.getTime();
};

export const getEndOfWeek = (date: Date = new Date()): number => {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // End on Saturday
  endOfWeek.setHours(23, 59, 59, 999);
  return endOfWeek.getTime();
};

export const getStartOfMonth = (date: Date = new Date()): number => {
  return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
};

export const getEndOfMonth = (date: Date = new Date()): number => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
};