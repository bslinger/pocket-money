import { useWindowDimensions } from 'react-native';

/**
 * Returns true when the screen is wide enough to be considered a tablet.
 * Used to switch between single-column (phone) and multi-column (tablet) layouts.
 */
export function useTablet(): boolean {
  const { width } = useWindowDimensions();
  return width >= 768;
}
