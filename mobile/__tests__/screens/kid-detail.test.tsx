import React from 'react';
import { render, waitFor } from '../test-utils';
import KidDetailScreen from '@/app/(app)/(tabs)/kids/[id]';

const mockGet = jest.fn();

jest.mock('@/lib/api', () => ({
  api: {
    get: (...args: any[]) => mockGet(...args),
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ id: 's1' }),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const mockSpender = {
  id: 's1',
  name: 'Alice',
  color: '#4CAF50',
  avatar_url: null,
  accounts: [
    {
      id: 'a1',
      name: 'Spending',
      balance: '75.00',
      currency_symbol: '$',
      transactions: [],
    },
    {
      id: 'a2',
      name: 'Savings',
      balance: '150.00',
      currency_symbol: '$',
      transactions: [],
    },
  ],
  savings_goals: [
    {
      id: 'g1',
      name: 'New Bike',
      target_amount: '200.00',
      allocated_amount: '80.00',
      is_completed: false,
      abandoned_at: null,
      account_id: 'a2',
      sort_order: 1,
    },
    {
      id: 'g2',
      name: 'Book',
      target_amount: '20.00',
      allocated_amount: '20.00',
      is_completed: true,
      abandoned_at: null,
      account_id: 'a1',
      sort_order: 2,
    },
  ],
  chores: [
    {
      id: 'ch1',
      name: 'Clean room',
      emoji: '🧹',
      frequency: 'daily',
      reward_type: 'earns',
      amount: '2.00',
    },
  ],
  users: [],
};

describe('KidDetailScreen', () => {
  beforeEach(() => {
    mockGet.mockClear();
  });

  it('renders kid header with name and balance', async () => {
    mockGet.mockResolvedValue({ data: { data: mockSpender } });
    const { getByText } = render(<KidDetailScreen />);

    await waitFor(() => {
      expect(getByText('Alice')).toBeTruthy();
      expect(getByText('$225.00')).toBeTruthy();
    });
  });

  it('on Accounts tab, shows Goals header within account cards', async () => {
    mockGet.mockResolvedValue({ data: { data: mockSpender } });
    const { getByText } = render(<KidDetailScreen />);

    await waitFor(() => {
      // The accounts tab is default, account cards with goals inside
      expect(getByText('Spending')).toBeTruthy();
      expect(getByText('Savings')).toBeTruthy();
      // The "Goals" header appears inside the Savings account card (goal g1 is active + linked to a2)
      expect(getByText('Goals')).toBeTruthy();
      expect(getByText('New Bike')).toBeTruthy();
    });
  });

  it('goals show progress bars within account cards', async () => {
    mockGet.mockResolvedValue({ data: { data: mockSpender } });
    const { getByText } = render(<KidDetailScreen />);

    await waitFor(() => {
      // g1: 80/200 = 40%
      expect(getByText('40%')).toBeTruthy();
      expect(getByText('New Bike')).toBeTruthy();
    });
  });

  it('shows skeleton while loading', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const { queryByText } = render(<KidDetailScreen />);
    expect(queryByText('Alice')).toBeNull();
  });

  it('shows empty state when no accounts', async () => {
    const emptySpender = { ...mockSpender, accounts: [], savings_goals: [] };
    mockGet.mockResolvedValue({ data: { data: emptySpender } });
    const { getByText } = render(<KidDetailScreen />);

    await waitFor(() => {
      expect(getByText('No accounts yet')).toBeTruthy();
    });
  });
});
