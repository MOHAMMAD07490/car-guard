import React from 'react';
import { View, Platform, Text } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// The user provided AdMob ad unit ID
const adUnitId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-5128179758660592/9423586105';

export const AdBanner = () => {
  // AdMob is a native module and will instantly crash Expo Go.
  // We check if the app is running in the Expo Go client, and show a placeholder instead.
  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  if (Platform.OS === 'web') {
    return null; // AdMob does not support web
  }

  if (isExpoGo) {
    return (
      <View style={{ width: '100%', alignItems: 'center', marginVertical: 10, padding: 20, backgroundColor: '#f0f0f0', borderRadius: 8 }}>
        <Text style={{ color: '#666', textAlign: 'center' }}>[AdMob Banner Placeholder]</Text>
        <Text style={{ color: '#999', fontSize: 12, textAlign: 'center' }}>Ads will appear in the compiled APK.</Text>
      </View>
    );
  }

  return (
    <View style={{ width: '100%', alignItems: 'center', marginVertical: 10 }}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
      />
    </View>
  );
};
