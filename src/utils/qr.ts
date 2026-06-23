import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { CarProfile } from '../types/car';

// Simple encoding for privacy - in production you'd use proper encryption
const base64Encode = (str: string): string => {
  if (typeof btoa !== 'undefined') {
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch {
      // fallback
    }
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  const encoded = encodeURIComponent(str);
  const bytes: number[] = [];
  for (let i = 0; i < encoded.length; i++) {
    if (encoded[i] === '%') {
      bytes.push(parseInt(encoded.substr(i + 1, 2), 16));
      i += 2;
    } else {
      bytes.push(encoded.charCodeAt(i));
    }
  }
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = bytes[i + 1] ?? 0;
    const b3 = bytes[i + 2] ?? 0;
    result += chars[b1 >> 2];
    result += chars[((b1 & 3) << 4) | (b2 >> 4)];
    result += i + 1 < bytes.length ? chars[((b2 & 15) << 2) | (b3 >> 6)] : '=';
    result += i + 2 < bytes.length ? chars[b3 & 63] : '=';
  }
  return result;
};

const base64Decode = (str: string): string => {
  if (typeof atob !== 'undefined') {
    try {
      return decodeURIComponent(escape(atob(str)));
    } catch {
      // fallback
    }
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const resultBytes: number[] = [];
  const cleaned = str.replace(/=+$/, '');
  for (let i = 0; i < cleaned.length; i += 4) {
    const b1 = chars.indexOf(cleaned[i]);
    const b2 = chars.indexOf(cleaned[i + 1]);
    const b3 = chars.indexOf(cleaned[i + 2]);
    const b4 = chars.indexOf(cleaned[i + 3]);
    resultBytes.push((b1 << 2) | (b2 >> 4));
    if (b3 >= 0) resultBytes.push(((b2 & 15) << 4) | (b3 >> 2));
    if (b4 >= 0) resultBytes.push(((b3 & 3) << 6) | b4);
  }
  let result = '';
  for (let i = 0; i < resultBytes.length; i++) {
    result += String.fromCharCode(resultBytes[i]);
  }
  return decodeURIComponent(escape(result));
};

export interface QRData {
  id: string;
  n: string;  // owner name
  cn: string; // car number (last 4 chars for privacy in display)
  cf: string; // full car number (encoded)
  p: string;  // phone (encoded)
  cm?: string; // car model
  cc?: string; // car color
}

export const getBaseWebUrl = (): string => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // If running in an Android Emulator, loopback to the host machine's localhost (10.0.2.2)
  if (Platform.OS === 'android' && !Device.isDevice) {
    return 'http://10.0.2.2:8081';
  }
  
  // For development with Expo Go, we can use the computer's IP address
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:8081`;
  }
  
  // Fallback production URL
  return 'https://carguard-privacy.web.app';
};

export const encodeCarToQR = (car: CarProfile): string => {
  const qrData: QRData = {
    id: car.id,
    n: car.ownerName,
    cn: car.carNumber.slice(-4),
    cf: base64Encode(car.carNumber),
    p: base64Encode(car.phoneNumber),
    cm: car.carModel,
    cc: car.carColor,
  };
  const encoded = base64Encode(JSON.stringify(qrData));
  const baseUrl = getBaseWebUrl();
  return `${baseUrl}/scan/${encoded}`;
};

export const decodeQRData = (encodedData: string): QRData | null => {
  try {
    const decoded = base64Decode(encodedData);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

export const decodePhone = (encodedPhone: string): string => {
  try {
    return base64Decode(encodedPhone);
  } catch {
    return '***';
  }
};

export const decodeCarNumber = (encodedCarNumber: string): string => {
  try {
    return base64Decode(encodedCarNumber);
  } catch {
    return '***';
  }
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

export const maskPhone = (phone: string): string => {
  if (phone.length <= 4) return '****';
  return '*'.repeat(phone.length - 4) + phone.slice(-4);
};
