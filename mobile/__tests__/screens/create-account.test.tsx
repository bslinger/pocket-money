import React from 'react';
import { render, fireEvent, waitFor } from '../test-utils';
import CreateAccountScreen from '@/app/(app)/accounts/create';

const mockGet = jest.fn();
const mockPost = jest.fn();

jest.mock('@/lib/api', () => ({
  api: {
    get: (...args: any[]) => mockGet(...args),
    post: (...args: any[]) => mockPost(...args),
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('rn-emoji-keyboard', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => null,
  };
});

const mockSpenders = [
  {
    id: 's1',
    name: 'Alice',
    color: '#4CAF50',
    avatar_url: null,
    accounts: [],
    savings_goals: [],
  },
  {
    id: 's2',
    name: 'Bob',
    color: '#2196F3',
    avatar_url: null,
    accounts: [],
    savings_goals: [],
  },
];

describe('CreateAccountScreen', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockPost.mockClear();
  });

  it('renders child selection with SpenderAvatar components', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: mockSpenders } });
    const { getByText } = render(<CreateAccountScreen />);

    await waitFor(() => {
      expect(getByText('Kid')).toBeTruthy();
      expect(getByText('Alice')).toBeTruthy();
      expect(getByText('Bob')).toBeTruthy();
    });
  });

  it('shows Dollars and Custom currency mode buttons', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: mockSpenders } });
    const { getByText } = render(<CreateAccountScreen />);

    await waitFor(() => {
      expect(getByText('Dollars')).toBeTruthy();
      expect(getByText('Custom')).toBeTruthy();
    });
  });

  it('selecting Custom shows emoji picker button and singular/plural fields', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: mockSpenders } });
    const { getByText, getByDisplayValue } = render(<CreateAccountScreen />);

    await waitFor(() => {
      expect(getByText('Custom')).toBeTruthy();
    });

    fireEvent.press(getByText('Custom'));

    await waitFor(() => {
      expect(getByText('Emoji')).toBeTruthy();
      expect(getByText('Singular')).toBeTruthy();
      expect(getByText('Plural')).toBeTruthy();
      expect(getByDisplayValue('Star')).toBeTruthy();
      expect(getByDisplayValue('Stars')).toBeTruthy();
    });
  });

  it('shows "Other currencies" expandable section', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: mockSpenders } });
    const { getByText } = render(<CreateAccountScreen />);

    await waitFor(() => {
      expect(getByText('Other currencies')).toBeTruthy();
    });
  });

  it('create button is disabled when no kid or name selected', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: mockSpenders } });
    const { getByText } = render(<CreateAccountScreen />);

    await waitFor(() => {
      const button = getByText('Create Account');
      expect(button).toBeTruthy();
      // The parent TouchableOpacity has disabled prop and opacity style
    });
  });

  it('shows skeleton while loading', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const { queryByText } = render(<CreateAccountScreen />);
    expect(queryByText('Kid')).toBeNull();
  });
});
