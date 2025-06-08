import { collections } from './database';

export interface ISeason {
    _id: string;
    name: string;
}

export async function GetAllSeasons() {
    return await collections.seasons?.find<ISeason>({}).toArray();
}
