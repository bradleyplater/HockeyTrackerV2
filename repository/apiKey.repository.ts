import { collections } from './database';

export interface IApiKey {
    key: string;
}

export async function GetAllApiKeys() {
    return await collections.apiKeys?.find<IApiKey>({}).toArray();
}
