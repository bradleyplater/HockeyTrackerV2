import { generateIdWithPrefix } from '../helpers/id-helper';
import {
    AddStatsObjectToPlayersInDatabase,
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
        stats: [],
    };

    try {
        return await InsertPlayerToDatabase(newPlayer);
    } catch (error) {
        throw error;
    }
};

export const addGameToPlayers = async (
    roster: string[],
    allPlayerInDatabase: IPlayer[],
    seasonId: string
) => {
    // If players do not have stat object for season this will add it for them
    await AddStatsObjectToPlayersIfNecessary(allPlayerInDatabase, roster, seasonId);


    return true;
};


const AddStatsObjectToPlayersIfNecessary = async (
    players: IPlayer[],
    roster: string[],
    seasonId: string
) => {
    const teamPlayers = players.filter((player) =>
        roster.includes(player._id)
    );

    // find all players without a stats object for this season
    const playersWithoutStats = teamPlayers.filter((player) => {
        const playerHasStats = player.stats.find((stat) => {
            return stat.seasonId === seasonId;
        });

        return !playerHasStats;
    });

    await AddStatsObjectToPlayersInDatabase(playersWithoutStats.map(player => player._id), seasonId);
}
