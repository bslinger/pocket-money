import { TextStyle } from 'react-native';

/**
 * Font family constants matching the names registered in useFonts.
 * Fraunces = display font (headings, logo, large numbers)
 * DMSans = body font (all UI text)
 */
export const fonts = {
  display: 'Fraunces',
  displayItalic: 'Fraunces-Italic',
  body: 'DMSans',
  bodyItalic: 'DMSans-Italic',
} as const;

/**
 * Pre-built text styles for common typography patterns.
 * Use these in StyleSheet.create() via spreading: ...typography.heading
 */
export const typography: Record<string, TextStyle> = {
  // Display / headings
  logo: { fontFamily: fonts.display, fontSize: 40, fontWeight: '700' },
  h1: { fontFamily: fonts.display, fontSize: 28, fontWeight: '700' },
  h2: { fontFamily: fonts.display, fontSize: 22, fontWeight: '600' },
  h3: { fontFamily: fonts.body, fontSize: 18, fontWeight: '600' },

  // Body text
  body: { fontFamily: fonts.body, fontSize: 15 },
  bodySmall: { fontFamily: fonts.body, fontSize: 13 },
  bodyBold: { fontFamily: fonts.body, fontSize: 15, fontWeight: '600' },

  // Labels / captions
  label: { fontFamily: fonts.body, fontSize: 13, fontWeight: '500' },
  caption: { fontFamily: fonts.body, fontSize: 12 },

  // Numbers (display font for large amounts)
  amount: { fontFamily: fonts.display, fontSize: 32, fontWeight: '700' },
  amountSmall: { fontFamily: fonts.display, fontSize: 20, fontWeight: '600' },

  // Buttons
  button: { fontFamily: fonts.body, fontSize: 16, fontWeight: '600' },
  buttonSmall: { fontFamily: fonts.body, fontSize: 14, fontWeight: '600' },
};
