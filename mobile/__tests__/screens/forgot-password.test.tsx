import React from 'react';
import { render, fireEvent, waitFor } from '../test-utils';
import ForgotPasswordScreen from '@/app/(auth)/forgot-password';

const mockPost = jest.fn();

jest.mock('@/lib/api', () => ({
  api: { post: (...args: any[]) => mockPost(...args) },
}));

jest.mock('expo-router', () => ({
  Link: ({ children }: any) => children,
}));

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    mockPost.mockClear();
  });

  it('renders the forgot password form', () => {
    const { getByText, getByPlaceholderText } = render(<ForgotPasswordScreen />);
    expect(getByText('Forgot Password')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByText('Send Reset Link')).toBeTruthy();
    expect(getByText('Back to login')).toBeTruthy();
  });

  it('sends reset link on submit', async () => {
    mockPost.mockResolvedValueOnce({});
    const { getByPlaceholderText, getByText } = render(<ForgotPasswordScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'ben@example.com');
    fireEvent.press(getByText('Send Reset Link'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/forgot-password', { email: 'ben@example.com' });
      expect(getByText('Password reset link sent to your email.')).toBeTruthy();
    });
  });

  it('shows error on failure', async () => {
    mockPost.mockRejectedValueOnce({
      response: { data: { message: 'We can\'t find a user with that email address.' } },
    });
    const { getByPlaceholderText, getByText } = render(<ForgotPasswordScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'unknown@example.com');
    fireEvent.press(getByText('Send Reset Link'));

    await waitFor(() => {
      expect(getByText("We can't find a user with that email address.")).toBeTruthy();
    });
  });

  it('shows "Sending..." while loading', async () => {
    mockPost.mockImplementation(() => new Promise(() => {}));
    const { getByPlaceholderText, getByText } = render(<ForgotPasswordScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'ben@example.com');
    fireEvent.press(getByText('Send Reset Link'));

    await waitFor(() => {
      expect(getByText('Sending...')).toBeTruthy();
    });
  });
});
