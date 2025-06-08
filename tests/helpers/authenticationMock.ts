import { configDotenv } from 'dotenv';
import * as ApiKeyRepository from '../../src/repository/apiKey.repository';

export const testApiKey = 'q0ye8adok6kds4utr50h06';

export function mockAuthKeys() {
    configDotenv();
    console.log(process.env.TEST_API_KEY);
    jest.spyOn(ApiKeyRepository, 'GetAllApiKeys').mockResolvedValue([
        { key: process.env.TEST_API_KEY as string },
    ]);
}

export function mockEmptyAuthKeys() {
    configDotenv();
    jest.spyOn(ApiKeyRepository, 'GetAllApiKeys').mockResolvedValue(undefined);
}
