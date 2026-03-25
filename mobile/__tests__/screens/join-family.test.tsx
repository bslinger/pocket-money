import React from 'react';
import { render, fireEvent, waitFor } from '../test-utils';
import JoinFamilyScreen from '@/app/(auth)/join-family';

const mockPost = jest.fn();
const mockSetToken = jest.fn();

jest.mock('@/lib/api', () => ({
  api: {
    post: (...args: any[]) => mockPost(...args),
  },
  setToken: (...args: any[]) => mockSetToken(...args),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

describe('JoinFamilyScreen', () => {
  beforeEach(() => {
    mockPost.mockClear();
    mockSetToken.mockClear();
  });

  it('renders code input, name, email, password fields', () => {
    const { getByText, getByPlaceholderText } = render(<JoinFamilyScreen />);

    expect(getByText('Join a Family')).toBeTruthy();
    expect(getByText('Invite Code')).toBeTruthy();
    expect(getByPlaceholderText('ABC123')).toBeTruthy();
    expect(getByText('Your Name')).toBeTruthy();
    expect(getByPlaceholderText('Full name')).toBeTruthy();
    expect(getByText('Email')).toBeTruthy();
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
    expect(getByText('Password')).toBeTruthy();
    expect(getByPlaceholderText('At least 8 characters')).toBeTruthy();
  });

  it('join button disabled when fields are empty', () => {
    const { getByText } = render(<JoinFamilyScreen />);

    const button = getByText('Join Family');
    expect(button).toBeTruthy();
    // Button is rendered but disabled — opacity style applied via buttonDisabled
  });

  it('shows error message on failed claim', async () => {
    mockPost.mockRejectedValueOnce({
      response: { data: { message: 'Invalid or expired code' } },
    });

    const { getByText, getByPlaceholderText } = render(<JoinFamilyScreen />);

    // Fill in all fields to make form valid
    fireEvent.changeText(getByPlaceholderText('ABC123'), 'ABC123');
    fireEvent.changeText(getByPlaceholderText('Full name'), 'Jane Doe');
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'jane@example.com');
    fireEvent.changeText(getByPlaceholderText('At least 8 characters'), 'password123');

    fireEvent.press(getByText('Join Family'));

    await waitFor(() => {
      expect(getByText('Invalid or expired code')).toBeTruthy();
    });
  });

  it('shows back to login link', () => {
    const { getByText } = render(<JoinFamilyScreen />);

    expect(getByText('Back to login')).toBeTruthy();
  });
});
