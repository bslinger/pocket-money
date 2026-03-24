import React from 'react';
import { render, waitFor } from '../test-utils';
import DashboardScreen from '@/app/(app)/(tabs)/index';

const mockGet = jest.fn();
const mockPatch = jest.fn();
const mockPost = jest.fn();

jest.mock('@/lib/api', () => ({
  api: {
    get: (...args: any[]) => mockGet(...args),
    patch: (...args: any[]) => mockPatch(...args),
    post: (...args: any[]) => mockPost(...args),
  },
}));

jest.mock('@/lib/auth', () => ({
  useAuth: () => ({
    user: { name: 'Ben', display_name: 'Ben', email: 'ben@example.com' },
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const parentDashboardData = {
  is_parent: true,
  families: [
    {
      id: '1',
      name: "Ben's Family",
      spenders: [
        {
          id: 's1',
          name: 'Alice',
          color: '#4CAF50',
          accounts: [{ id: 'a1', balance: '50.00' }],
          savings_goals: [
            { id: 'g1', name: 'New bike', target_amount: '100.00', allocated_amount: '50.00', is_completed: false },
          ],
        },
      ],
    },
  ],
  spenders: [],
  pending_completions: [
    {
      id: 'c1',
      completed_at: '2026-03-20T10:00:00Z',
      spender: { id: 's1', name: 'Alice', color: '#4CAF50' },
      chore: { id: 'ch1', name: 'Clean room', emoji: '🧹' },
    },
  ],
  recent_activity: [],
  total_balance: '50.00',
  paid_this_month: '10.00',
};

describe('DashboardScreen', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockPatch.mockClear();
    mockPost.mockClear();
  });

  it('shows skeleton while loading', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const { queryByText } = render(<DashboardScreen />);
    // Should not show greeting while loading
    expect(queryByText('Hi Ben')).toBeNull();
  });

  it('renders parent dashboard with stats', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: parentDashboardData } });
    const { getByText } = render(<DashboardScreen />);

    await waitFor(() => {
      expect(getByText('Hi Ben')).toBeTruthy();
      expect(getByText('Family Balance')).toBeTruthy();
      expect(getByText('Paid This Month')).toBeTruthy();
      expect(getByText('$10.00')).toBeTruthy();
    });
  });

  it('renders kid cards with balance and goal', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: parentDashboardData } });
    const { getByText } = render(<DashboardScreen />);

    await waitFor(() => {
      expect(getByText('Alice')).toBeTruthy();
      expect(getByText('New bike')).toBeTruthy();
    });
  });

  it('renders pending approvals', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: parentDashboardData } });
    const { getByText } = render(<DashboardScreen />);

    await waitFor(() => {
      expect(getByText('Needs your approval')).toBeTruthy();
      expect(getByText(/Clean room/)).toBeTruthy();
    });
  });

  it('renders child view when not parent', async () => {
    const childData = {
      ...parentDashboardData,
      is_parent: false,
      spenders: [
        {
          id: 's1',
          name: 'Alice',
          accounts: [{ id: 'a1', balance: '25.50' }],
          savings_goals: [],
          chores: [{ id: 'ch1', name: 'Clean room', emoji: '🧹' }],
        },
      ],
    };
    mockGet.mockResolvedValueOnce({ data: { data: childData } });
    const { getByText } = render(<DashboardScreen />);

    await waitFor(() => {
      expect(getByText('$25.50')).toBeTruthy();
      expect(getByText('Clean room')).toBeTruthy();
    });
  });
});
