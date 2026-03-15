import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from '@expo/vector-icons';

export type IconSet = 'ion' | 'mci' | 'fa5' | 'feather';

interface IconProps {
  name: string;
  set?: IconSet;
  size?: number;
  color?: string;
}

export function Icon({ name, set = 'ion', size = 24, color = '#FFFFFF' }: IconProps) {
  switch (set) {
    case 'mci':
      return <MaterialCommunityIcons name={name as any} size={size} color={color} />;
    case 'fa5':
      return <FontAwesome5 name={name as any} size={size} color={color} />;
    case 'feather':
      return <Feather name={name as any} size={size} color={color} />;
    default:
      return <Ionicons name={name as any} size={size} color={color} />;
  }
}

interface IconBubbleProps extends IconProps {
  bgColor?: string;
  bubbleSize?: number;
}

export function IconBubble({
  bgColor = '#6C3CE130',
  bubbleSize = 44,
  size = 22,
  ...iconProps
}: IconBubbleProps) {
  return (
    <View
      style={[
        styles.bubble,
        {
          width: bubbleSize,
          height: bubbleSize,
          borderRadius: bubbleSize / 2,
          backgroundColor: bgColor,
        },
      ]}
    >
      <Icon size={size} {...iconProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
