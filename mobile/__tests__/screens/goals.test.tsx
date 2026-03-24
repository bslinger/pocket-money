import React from 'react';
import { render, fireEvent, waitFor } from '../test-utils';
import GoalsListScreen from '@/app/(app)/(tabs)/goals/index';

const mockGet = jest.fn();
const mockPost = jest.fn();

jest.mock('@/lib/api', () => ({
  api: {
    get: (...args: any[]) => mockGet(...args),
    post: (...args: any[]) => mockPost(...args),
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const mockGoals = [
  {
    id: 'g1',
    name: 'New bike',
    target_amount: '100.00',
    allocated_amount: '50.00',
    is_completed: false,
    abandoned_at: null,
    sort_order: 1,
    spender_id: 's1',
    target_date: '2026-06-01',
    spender: { id: 's1', name: 'Alice', color: '#4CAF50', family_id: 'f1', avatar_url: null, currency_name: null, currency_name_plural: null, currency_symbol: null, use_integer_amounts: null, deleted_at: null, created_at: '', updated_at: '' },
  },
  {
    id: 'g2',
    name: 'Lego set',
    target_amount: '50.00',
    allocated_amount: '50.00',
    is_completed: true,
    abandoned_at: null,
    sort_order: 2,
    spender_id: 's1',
    target_date: null,
    spender: { id: 's1', name: 'Alice', color: '#4CAF50', family_id: 'f1', avatar_url: null, currency_name: null, currency_name_plural: null, currency_symbol: null, use_integer_amounts: null, deleted_at: null, created_at: '', updated_at: '' },
  },
];

describe('GoalsListScreen', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockPost.mockClear();
  });

  it('shows skeleton while loading', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const { queryByText } = render(<GoalsListScreen />);
    expect(queryByText('Goals')).toBeNull();
  });

  it('renders active goals by default', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: mockGoals } });
    const { getByText, queryByText } = render(<GoalsListScreen />);

    await waitFor(() => {
      expect(getByText('Goals')).toBeTruthy();
      expect(getByText('+ New Goal')).toBeTruthy();
      expect(getByText('New bike')).toBeTruthy();
      expect(queryByText('Lego set')).toBeNull(); // Completed, not shown in active tab
    });
  });

  it('shows goal progress percentage', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: mockGoals } });
    const { getByText } = render(<GoalsListScreen />);

    await waitFor(() => {
      expect(getByText('50%')).toBeTruthy();
      expect(getByText('$50.00')).toBeTruthy();
      expect(getByText('of $100.00')).toBeTruthy();
    });
  });

  it('shows target date', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: mockGoals } });
    const { getByText } = render(<GoalsListScreen />);

    await waitFor(() => {
      expect(getByText(/Target:/)).toBeTruthy();
    });
  });

  it('switches to completed tab', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: mockGoals } });
    const { getByText, queryByText } = render(<GoalsListScreen />);

    await waitFor(() => {
      expect(getByText('New bike')).toBeTruthy();
    });

    fireEvent.press(getByText('Completed'));

    await waitFor(() => {
      expect(getByText('Lego set')).toBeTruthy();
      expect(queryByText('New bike')).toBeNull();
    });
  });

  it('shows empty state when no goals', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } });
    const { getByText } = render(<GoalsListScreen />);

    await waitFor(() => {
      expect(getByText('No active goals. Create one to start saving!')).toBeTruthy();
    });
  });

  it('groups goals by spender', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: mockGoals } });
    const { getByText } = render(<GoalsListScreen />);

    await waitFor(() => {
      expect(getByText('Alice')).toBeTruthy();
    });
  });
});
