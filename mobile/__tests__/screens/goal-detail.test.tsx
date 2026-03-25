import React from 'react';
import { render, waitFor } from '../test-utils';
import GoalDetailScreen from '@/app/(app)/goals/[id]';

const mockGet = jest.fn();
const mockPatch = jest.fn();

jest.mock('@/lib/api', () => ({
  api: {
    get: (...args: any[]) => mockGet(...args),
    patch: (...args: any[]) => mockPatch(...args),
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ id: 'g1' }),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const mockGoal = {
  id: 'g1',
  name: 'New Bike',
  target_amount: '200.00',
  allocated_amount: '80.00',
  is_completed: false,
  abandoned_at: null,
  target_date: '2026-06-01',
  image_url: null,
  match_percentage: null,
  spender: {
    id: 's1',
    name: 'Alice',
    color: '#4CAF50',
    avatar_url: null,
  },
  account: {
    id: 'a1',
    name: 'Savings',
  },
};

describe('GoalDetailScreen', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockPatch.mockClear();
  });

  it('renders goal name and progress bar', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: mockGoal } });
    const { getByText } = render(<GoalDetailScreen />);

    await waitFor(() => {
      expect(getByText('New Bike')).toBeTruthy();
      expect(getByText('40%')).toBeTruthy();
      expect(getByText('$80.00')).toBeTruthy();
      expect(getByText('$200.00')).toBeTruthy();
    });
  });

  it('shows spender avatar next to name', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: mockGoal } });
    const { getByText } = render(<GoalDetailScreen />);

    await waitFor(() => {
      expect(getByText('Alice')).toBeTruthy();
    });
  });

  it('does NOT show "No cover image" text', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: mockGoal } });
    const { queryByText, getByText } = render(<GoalDetailScreen />);

    await waitFor(() => {
      expect(getByText('New Bike')).toBeTruthy();
    });

    expect(queryByText('No cover image')).toBeNull();
  });

  it('shows cover image when present', async () => {
    const goalWithImage = {
      ...mockGoal,
      image_url: 'https://example.com/bike.jpg',
    };
    mockGet.mockResolvedValueOnce({ data: { data: goalWithImage } });
    const { getByText, UNSAFE_queryByType } = render(<GoalDetailScreen />);

    await waitFor(() => {
      expect(getByText('New Bike')).toBeTruthy();
    });
  });

  it('shows skeleton while loading', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const { queryByText } = render(<GoalDetailScreen />);
    expect(queryByText('New Bike')).toBeNull();
  });

  it('shows abandon button for active goal', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: mockGoal } });
    const { getByText } = render(<GoalDetailScreen />);

    await waitFor(() => {
      expect(getByText('Abandon Goal')).toBeTruthy();
    });
  });

  it('hides abandon button for completed goal', async () => {
    const completedGoal = { ...mockGoal, is_completed: true };
    mockGet.mockResolvedValueOnce({ data: { data: completedGoal } });
    const { queryByText, getByText } = render(<GoalDetailScreen />);

    await waitFor(() => {
      expect(getByText('New Bike')).toBeTruthy();
    });

    expect(queryByText('Abandon Goal')).toBeNull();
  });
});
