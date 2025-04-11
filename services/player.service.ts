import { generateIdWithPrefix } from '../helpers/id-helper';
import { InsertPlayerToDatabase } from '../repository/player.repository';

export const addPlayerToDatabase = async (
    firstName: string,
    surname: string
) => {
    const newPlayer = {
        _id: generateIdWithPrefix('PLR'),
        firstName,
        surname,
    };

    try {
        return await InsertPlayerToDatabase(newPlayer);
    } catch (error) {
        throw error;
    }
};
