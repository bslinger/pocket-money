import React from 'react';
import { Text } from 'react-native';

const createIconMock = (name: string) => {
  const Icon = ({ name: iconName, size, color, ...props }: any) => (
    <Text {...props}>{iconName}</Text>
  );
  Icon.displayName = name;
  return Icon;
};

export const Feather = createIconMock('Feather');
export const MaterialIcons = createIconMock('MaterialIcons');
export const Ionicons = createIconMock('Ionicons');
export const FontAwesome = createIconMock('FontAwesome');
