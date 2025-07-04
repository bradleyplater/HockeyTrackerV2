import { generateGameMock } from '../../tests/helpers/game-mock';
import { generateIdWithPrefix } from '../helpers/id-helper';
import { InsertGameToDatabase } from '../repository/game.repository';
import {
    GetAllPlayersFromDatabase,
    IPlayer,
} from '../repository/player.repository';
import { IGame, IGamePlayer, IGamePostBody } from '../types/GameTypes';

export const CreateGame = async (postGame: IGamePostBody) => {
    // TODO: create game object

    const hydratedGame = await createHydratedGameObject(postGame);

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
    // TODO: generate game players

    // for each player in teamRoster, generate a player object
    // player should exist within the database, and be a part of the team
    // if player isn't in database or part of the team, just log that they don't exist and move on
    // player stats will be defaulted to 0

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
