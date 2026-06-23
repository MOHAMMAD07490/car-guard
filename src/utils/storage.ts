import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { CarProfile, AlertMessage } from '../types/car';
import { UserProfile } from '../types/user';
import { getBaseWebUrl } from './qr';

const CARS_KEY = '@carguard_cars';
const ALERTS_KEY = '@carguard_alerts';

// Memory cache fallback for environments without storage access (like missing legacy native modules)
const memoryStorage: Record<string, string> = {};

// Helper to construct absolute endpoint URLs for native / relative for web
export const getApiUrl = (endpoint: string): string => {
  if (Platform.OS === 'web') {
    return endpoint;
  }
  const base = getBaseWebUrl();
  return `${base}${endpoint}`;
};

// Fetch wrapper with abort controller timeout to prevent screen hangs
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 3000): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

// Safe universal local storage wrappers
const safeGetItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return memoryStorage[key] || null;
  }
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.warn(`Local storage read error for key ${key}:`, error);
    return memoryStorage[key] || null;
  }
};

const safeSetItem = async (key: string, value: string): Promise<void> => {
  memoryStorage[key] = value;
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
    return;
  }
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.warn(`Local storage write error for key ${key}:`, error);
  }
};

const safeRemoveItem = async (key: string): Promise<void> => {
  delete memoryStorage[key];
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
    return;
  }
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.warn(`Local storage remove error for key ${key}:`, error);
  }
};

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const tokenVal = await safeGetItem(TOKEN_KEY);
  return tokenVal ? { 'Authorization': `Bearer ${tokenVal}` } : {};
};

export const syncCarsFromCloud = async (ownerId: string): Promise<CarProfile[]> => {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await fetchWithTimeout(getApiUrl(`/api/cars?ownerId=${ownerId}`), {
      headers: authHeaders,
    });
    if (response.ok) {
      const cloudCars: CarProfile[] = await response.json();
      if (cloudCars && cloudCars.length > 0) {
        const localCars = await getCars();
        const merged = [...localCars];
        cloudCars.forEach(cloudCar => {
          if (!merged.some(localCar => localCar.id === cloudCar.id)) {
            merged.push(cloudCar);
          }
        });
        await safeSetItem(CARS_KEY, JSON.stringify(merged));
        return merged.filter(c => c.ownerId === ownerId);
      }
    }
  } catch (error) {
    console.warn('Failed to sync cars from cloud:', error);
  }
  const localCars = await getCars();
  return localCars.filter(c => c.ownerId === ownerId);
};

export const saveCar = async (car: CarProfile): Promise<void> => {
  // 1. Save locally (always mirrors to memory storage fallback)
  const cars = await getCars();
  const existing = cars.findIndex(c => c.id === car.id);
  
  // Associate the car with the currently logged-in user
  const currentUser = await getCurrentUser();
  if (currentUser) {
    car.ownerId = currentUser.id;
  }

  if (existing >= 0) {
    cars[existing] = car;
  } else {
    cars.push(car);
  }
  await safeSetItem(CARS_KEY, JSON.stringify(cars));

  // 2. Sync to Vercel Blob cloud via server API
  try {
    const authHeaders = await getAuthHeaders();
    await fetchWithTimeout(getApiUrl('/api/cars'), {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(car),
    });
  } catch (error) {
    console.warn('Failed to sync car details to cloud:', error);
  }
};

export const getCars = async (): Promise<CarProfile[]> => {
  const data = await safeGetItem(CARS_KEY);
  return data ? JSON.parse(data) : [];
};

export const deleteCar = async (id: string): Promise<void> => {
  // 1. Delete locally
  const cars = await getCars();
  const filtered = cars.filter(c => c.id !== id);
  await safeSetItem(CARS_KEY, JSON.stringify(filtered));

  // 2. Sync deletion to cloud API
  try {
    const authHeaders = await getAuthHeaders();
    await fetchWithTimeout(getApiUrl(`/api/cars?id=${id}`), {
      method: 'DELETE',
      headers: authHeaders,
    });
  } catch (error) {
    console.warn('Failed to delete car from cloud:', error);
  }
};

export const getCarById = async (id: string): Promise<CarProfile | null> => {
  // Try local first
  const cars = await getCars();
  const localCar = cars.find(c => c.id === id);
  if (localCar) return localCar;

  // Fallback to Server API (e.g. for owners accessing from multiple devices)
  try {
    const authHeaders = await getAuthHeaders();
    const response = await fetchWithTimeout(getApiUrl(`/api/cars?id=${id}`), {
      headers: authHeaders,
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('Failed to retrieve car details from cloud:', error);
  }
  return null;
};

export const saveAlert = async (alert: AlertMessage): Promise<void> => {
  // 1. Save locally
  const alerts = await getAlerts();
  alerts.unshift(alert);
  await safeSetItem(ALERTS_KEY, JSON.stringify(alerts));

  // 2. Upload alert to cloud Vercel Blob via server API (public visitor endpoint)
  try {
    await fetchWithTimeout(getApiUrl('/api/alerts'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
    });
  } catch (error) {
    console.warn('Failed to submit alert to cloud:', error);
  }
};

export const getAlerts = async (): Promise<AlertMessage[]> => {
  const localData = await safeGetItem(ALERTS_KEY);
  let localAlerts: AlertMessage[] = localData ? JSON.parse(localData) : [];

  // Sync / fetch from Vercel Blob cloud for all registered car profiles
  try {
    const cars = await getCars();
    if (cars.length > 0) {
      const carIds = cars.map(c => c.id).join(',');
      const authHeaders = await getAuthHeaders();
      const response = await fetchWithTimeout(getApiUrl(`/api/alerts?carIds=${carIds}`), {
        headers: authHeaders,
      });
      if (response.ok) {
        const { alerts } = await response.json();
        
        // Merge cloud alerts with local ones, skipping duplicates
        const merged = [...alerts];
        localAlerts.forEach(localAlert => {
          if (!merged.some(cloudAlert => cloudAlert.id === localAlert.id)) {
            merged.push(localAlert);
          }
        });
        
        merged.sort((a, b) => b.timestamp - a.timestamp);
        await safeSetItem(ALERTS_KEY, JSON.stringify(merged));
        return merged;
      }
    }
  } catch (error) {
    console.warn('Failed to sync alerts from cloud:', error);
  }

  return localAlerts;
};

export const getAlertsByCarId = async (carId: string): Promise<AlertMessage[]> => {
  const alerts = await getAlerts();
  return alerts.filter(a => a.carId === carId);
};

export const markAlertRead = async (alertId: string): Promise<void> => {
  const alerts = await getAlerts();
  const alert = alerts.find(a => a.id === alertId);
  if (alert) {
    alert.read = true;
    await safeSetItem(ALERTS_KEY, JSON.stringify(alerts));

    // Update state on cloud Vercel Blob via server API
    try {
      const authHeaders = await getAuthHeaders();
      await fetchWithTimeout(getApiUrl('/api/alerts'), {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ alertId, carId: alert.carId }),
      });
    } catch (error) {
      console.warn('Failed to mark alert as read on cloud:', error);
    }
  }
};

export const markAllAlertsRead = async (): Promise<void> => {
  const alerts = await getAlerts();
  
  // Mark read locally
  alerts.forEach(a => { a.read = true; });
  await safeSetItem(ALERTS_KEY, JSON.stringify(alerts));

  // Sync to cloud for each alert
  for (const alert of alerts) {
    try {
      await fetchWithTimeout(getApiUrl('/api/alerts'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId: alert.id, carId: alert.carId }),
      });
    } catch (error) {
      console.warn(`Failed to sync read status for alert ${alert.id}:`, error);
    }
  }
};

export const getUnreadCount = async (): Promise<number> => {
  const alerts = await getAlerts();
  return alerts.filter(a => !a.read).length;
};

export const clearAllData = async (): Promise<void> => {
  await safeRemoveItem(CARS_KEY);
  await safeRemoveItem(ALERTS_KEY);
};

const USER_KEY = '@carguard_user';
const TOKEN_KEY = '@carguard_token';

export const getCurrentUser = async (): Promise<UserProfile | null> => {
  const data = await safeGetItem(USER_KEY);
  return data ? JSON.parse(data) : null;
};

export const setCurrentUser = async (user: UserProfile, token: string): Promise<void> => {
  await safeSetItem(USER_KEY, JSON.stringify(user));
  await safeSetItem(TOKEN_KEY, token);
};

export const logout = async (): Promise<void> => {
  await safeRemoveItem(USER_KEY);
  await safeRemoveItem(TOKEN_KEY);
  await safeRemoveItem(CARS_KEY);
  await safeRemoveItem(ALERTS_KEY);
};

const THEME_KEY = '@carguard_theme';

export const getAppTheme = async (): Promise<'dark' | 'light'> => {
  const t = await safeGetItem(THEME_KEY);
  return t === 'light' ? 'light' : 'dark';
};

export const setAppTheme = async (theme: 'dark' | 'light'): Promise<void> => {
  await safeSetItem(THEME_KEY, theme);
};
