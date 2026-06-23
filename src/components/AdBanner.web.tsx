import React from 'react';

// For web builds, we completely bypass importing react-native-google-mobile-ads
// because the native Android/iOS dependencies will crash the Vercel Web Bundler.
export const AdBanner = () => {
  return null;
};
