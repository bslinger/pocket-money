import React from 'react';
import { render, fireEvent, waitFor } from '../test-utils';
import RegisterScreen from '@/app/(auth)/register';

const mockRegister = jest.fn();

jest.mock('@/lib/auth', () => ({
  useAuth: () => ({
    register: mockRegister,
  }),
}));

jest.mock('expo-router', () => ({
  Link: ({ children }: any) => children,
}));

describe('RegisterScreen', () => {
  beforeEach(() => {
    mockRegister.mockClear();
  });

  it('renders the registration form', () => {
    const { getByText, getByPlaceholderText } = render(<RegisterScreen />);
    expect(getByText('Quiddo')).toBeTruthy();
    expect(getByPlaceholderText('Name')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByPlaceholderText('Confirm Password')).toBeTruthy();
    expect(getByText('Create Account')).toBeTruthy();
  });

  it('shows login link', () => {
    const { getByText } = render(<RegisterScreen />);
    expect(getByText('Already have an account? Sign in')).toBeTruthy();
  });

  it('shows validation errors from the API', async () => {
    mockRegister.mockRejectedValueOnce({
      response: { data: { errors: { email: ['The email has already been taken.'] } } },
    });

    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('Name'), 'Test');
    fireEvent.changeText(getByPlaceholderText('Email'), 'taken@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'password123');
    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(getByText('The email has already been taken.')).toBeTruthy();
    });
  });
});
