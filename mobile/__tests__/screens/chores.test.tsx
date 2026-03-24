import React from 'react';
import { render, fireEvent, waitFor } from '../test-utils';
import ChoresScreen from '@/app/(app)/(tabs)/chores/index';

const mockGet = jest.fn();
const mockPatch = jest.fn();

jest.mock('@/lib/api', () => ({
  api: {
    get: (...args: any[]) => mockGet(...args),
    patch: (...args: any[]) => mockPatch(...args),
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const mockChoresData = {
  chores: [
    {
      id: 'ch1',
      name: 'Clean room',
      emoji: '🧹',
      frequency: 'daily',
      reward_type: 'fixed',
      amount: '2.00',
      is_active: true,
      days_of_week: [0, 1, 2, 3, 4],
      spenders: [{ id: 's1', name: 'Alice' }],
      completions: [],
    },
    {
      id: 'ch2',
      name: 'Take out bins',
      emoji: '🗑️',
      frequency: 'weekly',
      reward_type: 'fixed',
      amount: '5.00',
      is_active: false,
      days_of_week: [4],
      spenders: [],
      completions: [],
    },
  ],
  week_completions: [],
  pending_completions: [
    {
      id: 'pc1',
      completed_at: '2026-03-20T10:00:00Z',
      spender: { id: 's1', name: 'Alice', color: '#4CAF50' },
      chore: { id: 'ch1', name: 'Clean room', emoji: '🧹' },
    },
  ],
};

describe('ChoresScreen', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockPatch.mockClear();
  });

  it('shows skeleton while loading', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const { queryByText } = render(<ChoresScreen />);
    expect(queryByText('Chores')).toBeNull();
  });

  it('renders chores screen with segments', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: mockChoresData } });
    const { getByText } = render(<ChoresScreen />);

    await waitFor(() => {
      expect(getByText('Chores')).toBeTruthy();
      expect(getByText('+ New Chore')).toBeTruthy();
      expect(getByText(/Approvals/)).toBeTruthy();
      expect(getByText('Schedule')).toBeTruthy();
      expect(getByText('Manage')).toBeTruthy();
    });
  });

  it('shows pending approval in approvals tab', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: mockChoresData } });
    const { getByText } = render(<ChoresScreen />);

    await waitFor(() => {
      expect(getByText(/Clean room/)).toBeTruthy();
      expect(getByText(/Alice/)).toBeTruthy();
    });
  });

  it('switches to manage tab and shows chores', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: mockChoresData } });
    const { getByText } = render(<ChoresScreen />);

    await waitFor(() => {
      expect(getByText('Manage')).toBeTruthy();
    });

    fireEvent.press(getByText('Manage'));

    await waitFor(() => {
      expect(getByText('Take out bins')).toBeTruthy();
    });
  });

  it('shows no pending approvals message when empty', async () => {
    const emptyData = { ...mockChoresData, pending_completions: [] };
    mockGet.mockResolvedValueOnce({ data: { data: emptyData } });
    const { getByText } = render(<ChoresScreen />);

    await waitFor(() => {
      expect(getByText('No pending approvals')).toBeTruthy();
    });
  });
});
