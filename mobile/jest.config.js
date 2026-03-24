const path = require('path');

process.env.RNTL_SKIP_AUTO_DETECT_FAKE_TIMERS = 'true';

module.exports = {
  preset: 'react-native',
  roots: ['<rootDir>'],
  setupFiles: [path.resolve(__dirname, 'jest.setup.js')],
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { configFile: path.resolve(__dirname, 'babel.config.js') }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|native-base|react-native-svg|@tanstack/.*|@shopify/.*|rn-emoji-keyboard|@react-native-async-storage/.*|@quiddo/.*)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@quiddo/shared$': path.resolve(__dirname, '../packages/shared/src/index.ts'),
    '@testing-library/react-native/src/helpers/ensure-peer-deps': '<rootDir>/__mocks__/empty.ts',
  },
  moduleDirectories: ['node_modules', path.resolve(__dirname, '../node_modules')],
  setupFiles: [path.resolve(__dirname, '../node_modules/react-native/jest/setup.js')],
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  testPathIgnorePatterns: ['/node_modules/', '/\\.expo/', '__tests__/test-utils\\.tsx$'],
};
