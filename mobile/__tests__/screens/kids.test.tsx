import React from 'react';
import { render, waitFor } from '../test-utils';
import KidsListScreen from '@/app/(app)/(tabs)/kids/index';

const mockGet = jest.fn();

jest.mock('@/lib/api', () => ({
  api: { get: (...args: any[]) => mockGet(...args) },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@expo/vector-icons', () => ({
  Feather: ({ name }: any) => {
    const { Text } = require('react-native');
    return <Text>{name}</Text>;
  },
}));

const mockSpenders = [
  {
    id: 's1',
    name: 'Alice',
    color: '#4CAF50',
    accounts: [{ id: 'a1', balance: '25.00' }, { id: 'a2', balance: '10.50' }],
  },
  {
    id: 's2',
    name: 'Bob',
    color: '#2196F3',
    accounts: [{ id: 'a3', balance: '100.00' }],
  },
];

describe('KidsListScreen', () => {
  beforeEach(() => {
    mockGet.mockClear();
  });

  it('shows skeleton while loading', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const { queryByText } = render(<KidsListScreen />);
    expect(queryByText('Kids')).toBeNull();
  });

  it('renders kids list with balances', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: mockSpenders } });
    const { getByText } = render(<KidsListScreen />);

    await waitFor(() => {
      expect(getByText('Kids')).toBeTruthy();
      expect(getByText('+ Add Kid')).toBeTruthy();
      expect(getByText('Alice')).toBeTruthy();
      expect(getByText('$35.50')).toBeTruthy(); // 25 + 10.50
      expect(getByText('Bob')).toBeTruthy();
      expect(getByText('$100.00')).toBeTruthy();
    });
  });

  it('shows empty state when no kids', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } });
    const { getByText } = render(<KidsListScreen />);

    await waitFor(() => {
      expect(getByText('No kids yet. Tap "Add Kid" to get started.')).toBeTruthy();
    });
  });
});
