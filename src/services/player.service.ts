import { generateIdWithPrefix } from '../helpers/id-helper';
import {
    InsertPlayerToDatabase,
    IPlayer,
} from '../repository/player.repository';

export const addPlayerToDatabase = async (
    firstName: string,
    surname: string
) => {
    const newPlayer: IPlayer = {
        _id: generateIdWithPrefix('PLR'),
        firstName,
        surname,
        teams: [],
    };

    try {
        return await InsertPlayerToDatabase(newPlayer);
    } catch (error) {
        throw error;
    }
};
