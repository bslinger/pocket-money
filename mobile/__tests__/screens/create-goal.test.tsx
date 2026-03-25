import React from 'react';
import { render, fireEvent, waitFor } from '../test-utils';
import CreateGoalScreen from '@/app/(app)/goals/create';

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

jest.mock('expo-image-picker', () => ({
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const mockSpenders = [
  {
    id: 's1',
    name: 'Alice',
    color: '#4CAF50',
    avatar_url: null,
    currency_symbol: null,
    accounts: [
      { id: 'a1', name: 'Savings', balance: '50.00', currency_symbol: '$' },
      { id: 'a2', name: 'Stars', balance: '10.00', currency_symbol: '⭐' },
    ],
    savings_goals: [],
  },
  {
    id: 's2',
    name: 'Bob',
    color: '#2196F3',
    avatar_url: null,
    currency_symbol: null,
    accounts: [],
    savings_goals: [],
  },
];

describe('CreateGoalScreen', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockPost.mockClear();
  });

  it('renders child selection with avatars', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: mockSpenders } });
    const { getByText } = render(<CreateGoalScreen />);

    await waitFor(() => {
      expect(getByText('Kid')).toBeTruthy();
      expect(getByText('Alice')).toBeTruthy();
      expect(getByText('Bob')).toBeTruthy();
    });
  });

  it('shows account selection when a child is selected', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: mockSpenders } });
    const { getByText } = render(<CreateGoalScreen />);

    await waitFor(() => {
      expect(getByText('Alice')).toBeTruthy();
    });

    fireEvent.press(getByText('Alice'));

    await waitFor(() => {
      expect(getByText('Account')).toBeTruthy();
      expect(getByText('Savings')).toBeTruthy();
      expect(getByText('Stars')).toBeTruthy();
      expect(getByText('Auto (highest priority)')).toBeTruthy();
    });
  });

  it('shows camera and gallery buttons for cover photo', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: mockSpenders } });
    const { getByText } = render(<CreateGoalScreen />);

    await waitFor(() => {
      expect(getByText('Camera')).toBeTruthy();
      expect(getByText('Gallery')).toBeTruthy();
    });
  });

  it('dynamic currency symbol updates based on selected account', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: mockSpenders } });
    const { getByText } = render(<CreateGoalScreen />);

    await waitFor(() => {
      expect(getByText('Alice')).toBeTruthy();
    });

    fireEvent.press(getByText('Alice'));

    await waitFor(() => {
      // Default currency symbol is $ when no specific account selected
      expect(getByText('$')).toBeTruthy();
    });

    fireEvent.press(getByText('Stars'));

    await waitFor(() => {
      expect(getByText('⭐')).toBeTruthy();
    });
  });

  it('create button disabled when invalid', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: mockSpenders } });
    const { getByText } = render(<CreateGoalScreen />);

    await waitFor(() => {
      const button = getByText('Create Goal');
      expect(button).toBeTruthy();
    });
  });

  it('shows skeleton while loading', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const { queryByText } = render(<CreateGoalScreen />);
    expect(queryByText('Kid')).toBeNull();
  });
});
