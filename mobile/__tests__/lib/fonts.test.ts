import { fonts, typography } from '@/lib/fonts';

describe('Fonts', () => {
  it('defines display and body font families', () => {
    expect(fonts.display).toBe('Fraunces');
    expect(fonts.body).toBe('DMSans');
  });

  it('defines italic variants', () => {
    expect(fonts.displayItalic).toBe('Fraunces-Italic');
    expect(fonts.bodyItalic).toBe('DMSans-Italic');
  });
});

describe('Typography presets', () => {
  it('has logo style using display font', () => {
    expect(typography.logo.fontFamily).toBe(fonts.display);
    expect(typography.logo.fontSize).toBe(40);
  });

  it('has body style using body font', () => {
    expect(typography.body.fontFamily).toBe(fonts.body);
  });

  it('does not include fontWeight (breaks variable fonts on Android)', () => {
    for (const [key, style] of Object.entries(typography)) {
      expect(style).not.toHaveProperty('fontWeight',
        `typography.${key} should not have fontWeight — variable fonts handle weight internally`);
    }
  });
});
