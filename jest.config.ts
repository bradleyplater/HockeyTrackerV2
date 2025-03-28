import { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.ts'], // Ensure test files match this pattern
    moduleFileExtensions: ['ts', 'js'],
    collectCoverage: true, // Ensure coverage is enabled
    coveragePathIgnorePatterns: ['/repository/database.ts'],
    coverageThreshold: {
        global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100,
        },
    },
};

export default config;
