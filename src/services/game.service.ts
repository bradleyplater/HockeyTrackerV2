import { generateGameMock } from '../../tests/helpers/game-mock';
import { generateIdWithPrefix } from '../helpers/id-helper';
import { AddGoalToGameInDatabase, GetGameById, InsertGameToDatabase } from '../repository/game.repository';
import {
    AddStatsObjectToPlayersInDatabase,
    GetAllPlayersFromDatabase,
    GetPlayerByIdFromDatabase,
    IncrementAssistsForPlayerInDatabase,
    IncrementGoalsForPlayerInDatabase,
    IPlayer,
} from '../repository/player.repository';
import { IncrementAssistsForTeamInDatabase, IncrementGoalsForTeamInDatabase } from '../repository/team.repository';
import { IAddGoalBody, IGame, IGamePlayer, IGamePostBody } from '../types/GameTypes';
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

export const AddGoalToGame = async (gameId: string, addGoal: IAddGoalBody) => {
    //check game exists

    const game = await GetGameById(gameId);
    await GetPlayerByIdFromDatabase(addGoal.scoredBy);
    if(addGoal.assist1) {
        await GetPlayerByIdFromDatabase(addGoal.assist1)
    }
    if (addGoal.assist2) {
        await GetPlayerByIdFromDatabase(addGoal.assist2)
    }

    // add new goal object to game
    await AddGoalToGameInDatabase(gameId, addGoal);

    // update player stats for goal scorer and assists
    await IncrementGoalsForPlayerInDatabase(addGoal.scoredBy, game.seasonId);
    await IncrementGoalsForTeamInDatabase(game.team.id, addGoal.scoredBy, game.seasonId);

    if (addGoal.assist1) {
        await IncrementAssistsForPlayerInDatabase(addGoal.assist1, game.seasonId);
        await IncrementAssistsForTeamInDatabase(game.team.id, addGoal.assist1, game.seasonId);
    }
    if (addGoal.assist2) {
        await IncrementAssistsForPlayerInDatabase(addGoal.assist2, game.seasonId);
        await IncrementAssistsForTeamInDatabase(game.team.id, addGoal.assist2, game.seasonId);
    }
}

const createHydratedGameObject = async (
    postGame: IGamePostBody
): Promise<IGame> => {
    return {
        _id: generateIdWithPrefix('GME'),
        date: new Date(postGame.date),
        seasonId: postGame.seasonId,
        type: postGame.type,
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
