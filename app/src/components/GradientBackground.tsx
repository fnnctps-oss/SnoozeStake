import React from 'react';
import { StyleSheet, View } from 'react-native';

export function GradientBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.background}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
