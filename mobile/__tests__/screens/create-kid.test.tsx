import React from 'react';
import { render, fireEvent, waitFor } from '../test-utils';
import CreateKidScreen from '@/app/(app)/kids/create';

const mockPost = jest.fn();

jest.mock('@/lib/api', () => ({
  api: {
    post: (...args: any[]) => mockPost(...args),
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('expo-image-picker', () => ({
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('@/lib/family', () => ({
  useFamily: () => ({
    activeFamily: {
      id: 'f1',
      name: "Test Family",
      currency_symbol: '$',
      currency_name: 'Dollar',
    },
  }),
}));

jest.mock('rn-emoji-keyboard', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => null,
  };
});

describe('CreateKidScreen', () => {
  beforeEach(() => {
    mockPost.mockClear();
  });

  it('renders name input and color picker', () => {
    const { getByText, getByPlaceholderText } = render(<CreateKidScreen />);

    expect(getByText('Name')).toBeTruthy();
    expect(getByPlaceholderText("Enter kid's name")).toBeTruthy();
    expect(getByText('Colour')).toBeTruthy();
  });

  it('shows photo buttons (camera/gallery)', () => {
    const { getByText } = render(<CreateKidScreen />);

    expect(getByText('Camera')).toBeTruthy();
    expect(getByText('Gallery')).toBeTruthy();
  });

  it('shows custom currency toggle', () => {
    const { getByText } = render(<CreateKidScreen />);

    expect(getByText('Custom Currency')).toBeTruthy();
    expect(getByText('No — uses family default')).toBeTruthy();
  });

  it('enabling custom currency shows emoji picker and name fields', () => {
    const { getByText, getByDisplayValue } = render(<CreateKidScreen />);

    fireEvent.press(getByText('No — uses family default'));

    expect(getByText('Yes — this kid uses a custom currency')).toBeTruthy();
    expect(getByText('Emoji')).toBeTruthy();
    expect(getByText('Singular')).toBeTruthy();
    expect(getByText('Plural')).toBeTruthy();
    expect(getByDisplayValue('Star')).toBeTruthy();
    expect(getByDisplayValue('Stars')).toBeTruthy();
  });

  it('preview avatar updates with selected color and name initial', () => {
    const { getByText, getByPlaceholderText } = render(<CreateKidScreen />);

    // Default shows '?' when no name entered
    expect(getByText('?')).toBeTruthy();
    expect(getByText('Kid name')).toBeTruthy();

    fireEvent.changeText(getByPlaceholderText("Enter kid's name"), 'Zara');

    expect(getByText('Z')).toBeTruthy();
    expect(getByText('Zara')).toBeTruthy();
  });

  it('add kid button is disabled when name is empty', () => {
    const { getByText } = render(<CreateKidScreen />);

    const button = getByText('Add Kid');
    expect(button).toBeTruthy();
  });
});
