import React from 'react';
import { render, fireEvent, waitFor } from '../test-utils';
import LoginScreen from '@/app/(auth)/login';

const mockLogin = jest.fn();

jest.mock('@/lib/auth', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

jest.mock('expo-router', () => ({
  Link: ({ children }: any) => children,
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    mockLogin.mockClear();
  });

  it('renders the login form', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    expect(getByText('Quiddo')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('renders forgot password and register links', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText('Forgot password?')).toBeTruthy();
    expect(getByText("Don't have an account? Sign up")).toBeTruthy();
  });

  it('calls login with email and password on submit', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'ben@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'test1234');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('ben@example.com', 'test1234', expect.any(String));
    });
  });

  it('shows error on failed login', async () => {
    mockLogin.mockRejectedValueOnce({
      response: { data: { message: 'The provided credentials are incorrect.' } },
    });

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'bad@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrong');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(getByText('The provided credentials are incorrect.')).toBeTruthy();
    });
  });

  it('shows "Signing in..." while loading', async () => {
    mockLogin.mockImplementation(() => new Promise(() => {})); // Never resolves
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'ben@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'test');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(getByText('Signing in...')).toBeTruthy();
    });
  });
});
