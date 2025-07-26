import { generateGameMock } from '../../tests/helpers/game-mock';
import { generateIdWithPrefix } from '../helpers/id-helper';
import { InsertGameToDatabase } from '../repository/game.repository';
import {
    AddStatsObjectToPlayersInDatabase,
    GetAllPlayersFromDatabase,
    IPlayer,
} from '../repository/player.repository';
import { IGame, IGamePlayer, IGamePostBody } from '../types/GameTypes';
import { addGameToPlayers } from './player.service';
import { addGameToTeam } from './team.service';

export const CreateGame = async (postGame: IGamePostBody) => {
    // TODO: create game object
    const allPlayerInDatabase = await GetAllPlayersFromDatabase();
    const hydratedGame = await createHydratedGameObject(postGame);

    // need to update player to have correct stats for game

    await addGameToPlayers(postGame.teamRoster, allPlayerInDatabase, postGame.seasonId);
    await addGameToTeam(postGame.team, postGame.teamRoster, postGame.seasonId);

    const returnedGame = await InsertGameToDatabase(hydratedGame);

    return returnedGame;
};

const createHydratedGameObject = async (
    postGame: IGamePostBody
): Promise<IGame> => {
    return {
        _id: generateIdWithPrefix('GME'),
        date: new Date(postGame.date),
        opponentTeam: {
            name: postGame.opponentName,
            goals: [],
            penalties: [],
        },
        team: {
            id: postGame.team,
            roster: await generateGamePlayers(
                postGame.teamRoster,
                postGame.team
            ),
            goals: [],
            penalties: [],
        },
        score: {
            team: 0,
            opponent: 0,
            periods: [
                {
                    number: 1,
                    team: 0,
                    opponent: 0,
                },
                {
                    number: 2,
                    team: 0,
                    opponent: 0,
                },
                {
                    number: 3,
                    team: 0,
                    opponent: 0,
                },
            ],
        },
    };
};

const generateGamePlayers = async (
    teamRoster: string[],
    teamId: string
): Promise<IGamePlayer[]> => {
    const allPlayerInDatabase = await GetAllPlayersFromDatabase();

    const gamePlayers: IGamePlayer[] = teamRoster.reduce((acc, playerId) => {
        const player = allPlayerInDatabase.find((p) => p._id === playerId);

        if (!player) {
            console.log(
                `Player not added to game due to not existing in database`,
                playerId
            );
            return acc;
        }

        if (!player.teams.find((t) => t.teamId === teamId)) {
            console.log(
                `Player not added to game due to not existing in team`,
                playerId
            );
            return acc;
        }

        acc.push({
            playerId,
            teamId,
            stats: { goals: 0, assists: 0, pims: 0 },
        });

        return acc;
    }, [] as IGamePlayer[]);

    return gamePlayers;
};
