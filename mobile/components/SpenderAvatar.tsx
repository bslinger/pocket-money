import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';

interface SpenderAvatarProps {
  name: string;
  color?: string | null;
  avatarUrl?: string | null;
  size?: number;
}

export default function SpenderAvatar({ name, color, avatarUrl, size = 40 }: SpenderAvatarProps) {
  const bg = color ?? colors.eucalyptus[400];
  const fontSize = size * 0.4;
  const borderRadius = size / 2;

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{ width: size, height: size, borderRadius, backgroundColor: bg }}
      />
    );
  }

  return (
    <View style={{ width: size, height: size, borderRadius, backgroundColor: bg, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontFamily: fonts.body, color: colors.white, fontSize }}>
        {name[0]?.toUpperCase()}
      </Text>
    </View>
  );
}
