import { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.ts'], // Ensure test files match this pattern
    moduleFileExtensions: ['ts', 'js'],
};

export default config;
