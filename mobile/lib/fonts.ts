import { TextStyle } from 'react-native';

/**
 * Font family constants matching the names registered in useFonts.
 * Fraunces = display font (headings, logo, large numbers)
 * DMSans = body font (all UI text)
 *
 * IMPORTANT: Do NOT use fontWeight alongside fontFamily on Android.
 * Variable fonts handle weight internally — adding fontWeight causes
 * Android to fall back to the system font.
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
 *
 * No fontWeight — variable fonts handle weight via the font file itself.
 */
export const typography: Record<string, TextStyle> = {
  // Display / headings
  logo: { fontFamily: fonts.display, fontSize: 40 },
  h1: { fontFamily: fonts.display, fontSize: 28 },
  h2: { fontFamily: fonts.display, fontSize: 22 },
  h3: { fontFamily: fonts.body, fontSize: 18 },

  // Body text
  body: { fontFamily: fonts.body, fontSize: 15 },
  bodySmall: { fontFamily: fonts.body, fontSize: 13 },

  // Labels / captions
  label: { fontFamily: fonts.body, fontSize: 13 },
  caption: { fontFamily: fonts.body, fontSize: 12 },

  // Numbers (display font for large amounts)
  amount: { fontFamily: fonts.display, fontSize: 32 },
  amountSmall: { fontFamily: fonts.display, fontSize: 20 },

  // Buttons
  button: { fontFamily: fonts.body, fontSize: 16 },
  buttonSmall: { fontFamily: fonts.body, fontSize: 14 },
};
