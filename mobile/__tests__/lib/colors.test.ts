import { colors } from '@/lib/colors';

describe('Design system colors', () => {
  it('has eucalyptus palette', () => {
    expect(colors.eucalyptus[400]).toBe('#4A7C59');
  });

  it('has bark palette', () => {
    expect(colors.bark[100]).toBeDefined();
    expect(colors.bark[700]).toBeDefined();
  });

  it('has semantic colors', () => {
    expect(colors.gumleaf[400]).toBeDefined(); // earn/approve
    expect(colors.redearth[400]).toBeDefined(); // spend/decline
    expect(colors.wattle[400]).toBeDefined();   // goals/balances
  });

  it('has white defined', () => {
    expect(colors.white).toBe('#FFFFFF');
  });
});
