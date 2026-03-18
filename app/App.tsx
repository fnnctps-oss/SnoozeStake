import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StripeProvider } from '@stripe/stripe-react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { paymentApi } from './src/services/api';

const queryClient = new QueryClient();

export default function App() {
  const [publishableKey, setPublishableKey] = useState('');

  useEffect(() => {
    paymentApi.getConfig()
      .then(({ publishableKey }) => setPublishableKey(publishableKey))
      .catch(() => {
        // Fallback for dev — set a placeholder so StripeProvider doesn't crash
        setPublishableKey('pk_test_placeholder');
      });
  }, []);

  return (
    <StripeProvider publishableKey={publishableKey} merchantIdentifier="merchant.com.snoozestake">
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <AppNavigator />
      </QueryClientProvider>
    </StripeProvider>
  );
}
