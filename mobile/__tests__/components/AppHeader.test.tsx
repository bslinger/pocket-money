import React from 'react';
import { render, fireEvent, waitFor } from '../test-utils';
import AppHeader from '@/components/AppHeader';

// Mock the hooks
jest.mock('@/lib/auth', () => ({
  useAuth: () => ({
    user: { name: 'Ben', display_name: 'Ben', email: 'ben@example.com' },
    logout: jest.fn(),
  }),
}));

jest.mock('@/lib/family', () => ({
  useFamily: () => ({
    families: [{ id: '1', name: "Ben's Family" }],
    activeFamily: { id: '1', name: "Ben's Family" },
    switchFamily: jest.fn(),
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('AppHeader', () => {
  it('renders the Quiddo logo', () => {
    const { getByText } = render(<AppHeader />);
    expect(getByText('Quiddo')).toBeTruthy();
  });

  it('has a profile menu button', () => {
    const { getByLabelText } = render(<AppHeader />);
    expect(getByLabelText('Profile menu')).toBeTruthy();
  });

  it('opens the profile panel when profile button is tapped', async () => {
    const { getByLabelText, getByText } = render(<AppHeader />);
    fireEvent.press(getByLabelText('Profile menu'));
    await waitFor(() => {
      expect(getByText('Profile settings')).toBeTruthy();
    });
  });

  it('shows user name in the panel', async () => {
    const { getByLabelText, getByText } = render(<AppHeader />);
    fireEvent.press(getByLabelText('Profile menu'));
    await waitFor(() => {
      expect(getByText('Ben')).toBeTruthy();
      expect(getByText('ben@example.com')).toBeTruthy();
    });
  });

  it('shows family name in the panel', async () => {
    const { getByLabelText, getAllByText } = render(<AppHeader />);
    fireEvent.press(getByLabelText('Profile menu'));
    await waitFor(() => {
      expect(getAllByText("Ben's Family").length).toBeGreaterThan(0);
    });
  });

  it('shows logout option in the panel', async () => {
    const { getByLabelText, getByText } = render(<AppHeader />);
    fireEvent.press(getByLabelText('Profile menu'));
    await waitFor(() => {
      expect(getByText('Log out')).toBeTruthy();
    });
  });
});
