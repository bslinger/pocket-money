import { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, type TextInputProps } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/lib/colors';

export default function PasswordField(props: TextInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.container}>
      <TextInput
        {...props}
        secureTextEntry={!visible}
        style={[styles.input, props.style]}
      />
      <TouchableOpacity
        style={styles.toggle}
        onPress={() => setVisible(v => !v)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
      >
        <Feather name={visible ? 'eye-off' : 'eye'} size={18} color={colors.bark[600]} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', justifyContent: 'center' },
  input: { paddingRight: 44 },
  toggle: { position: 'absolute', right: 14 },
});
