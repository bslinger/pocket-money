import React from 'react';
import { FlatList } from 'react-native';

export const FlashList = React.forwardRef((props: any, ref: any) => (
  <FlatList {...props} ref={ref} />
));
FlashList.displayName = 'FlashList';
