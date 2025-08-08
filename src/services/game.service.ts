import { generateIdWithPrefix } from '../helpers/id-helper';
import { AddGoalToGameInDatabase, AddOpponentGoalToGameInDatabase, AddPenaltyToGameInDatabase, AddOpponentPenaltyToGameInDatabase, GetAllGamesFromDatabase, GetGameById, InsertGameToDatabase, RemoveGoalFromGameInDatabase, RemoveOpponentGoalFromGameInDatabase, RemovePenaltyFromGameInDatabase, RemoveOpponentPenaltyFromGameInDatabase } from '../repository/game.repository';
import {
    DecrementAssistsForPlayerInDatabase,
    DecrementGoalsForPlayerInDatabase,
    DecrementPimsForPlayerInDatabase,
    GetAllPlayersFromDatabase,
    GetPlayerByIdFromDatabase,
    IncrementAssistsForPlayerInDatabase,
    IncrementGoalsForPlayerInDatabase,
    IncrementPimsForPlayerInDatabase,
} from '../repository/player.repository';
import { DecrementAssistsForTeamInDatabase, DecrementGoalsForTeamInDatabase, DecrementPimsForTeamInDatabase, IncrementAssistsForTeamInDatabase, IncrementGoalsForTeamInDatabase, IncrementPimsForTeamInDatabase } from '../repository/team.repository';
import { IAddGoalBody, IAddOpponentGoalBody, IAddPenaltyBody, IAddOpponentPenaltyBody, IGame, IGamePlayer, IGamePostBody } from '../types/GameTypes';
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

export const GetAllGames = async (): Promise<IGame[]> => {
    return await GetAllGamesFromDatabase();
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

/**
 * This method will remove a specific goal from a game
 * It will decrement all relevant statistics for players and teams
 * 
 * @param gameId - The ID of the game to remove the goal from
 * @param goalId - The ID of the specific goal to remove
 * @returns The updated game
 */
export const RemoveGoalFromGame = async (gameId: string, goalId: string): Promise<IGame> => {
    // Remove the goal from the game database and get the removed goal info
    const { result, removedGoal } = await RemoveGoalFromGameInDatabase(gameId, goalId);
    
    // Get the updated game
    const game = await GetGameById(gameId);
    
    // Decrement goals for the scorer in player database
    await DecrementGoalsForPlayerInDatabase(removedGoal.scoredBy, game.seasonId);
    
    // Decrement goals for the scorer in team database
    await DecrementGoalsForTeamInDatabase(game.team.id, removedGoal.scoredBy, game.seasonId);
    
    // Decrement assists for assist1 if it exists
    if (removedGoal.assist1) {
        await DecrementAssistsForPlayerInDatabase(removedGoal.assist1, game.seasonId);
        await DecrementAssistsForTeamInDatabase(game.team.id, removedGoal.assist1, game.seasonId);
    }
    
    // Decrement assists for assist2 if it exists
    if (removedGoal.assist2) {
        await DecrementAssistsForPlayerInDatabase(removedGoal.assist2, game.seasonId);
        await DecrementAssistsForTeamInDatabase(game.team.id, removedGoal.assist2, game.seasonId);
    }
    
    return game;
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

        if (!player.teams.find((t: { teamId: string }) => t.teamId === teamId)) {
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

export const AddOpponentGoalToGame = async (gameId: string, addGoal: IAddOpponentGoalBody) => {
    // Check game exists
    await GetGameById(gameId);
    
    // Add new goal object to opponent team
    const newGoal = await AddOpponentGoalToGameInDatabase(gameId, addGoal);
    
    return newGoal;
};

export const RemoveOpponentGoalFromGame = async (gameId: string, goalId: string) => {
    // Check game exists
    await GetGameById(gameId);
    
    // Remove the specific opponent goal from the game
    const { result, removedGoal } = await RemoveOpponentGoalFromGameInDatabase(gameId, goalId);
    
    return { message: 'Opponent goal removed successfully', removedGoal };
};

export const AddPenaltyToGame = async (gameId: string, addPenalty: IAddPenaltyBody) => {
    // Check game exists
    const game = await GetGameById(gameId);
    
    // Add new penalty object to team
    const newPenalty = await AddPenaltyToGameInDatabase(gameId, addPenalty);
    
    // Update player and team PIMS stats (only if not a bench penalty)
    if (addPenalty.playerId !== 'BENCH') {
        // Update player stats
        await IncrementPimsForPlayerInDatabase(addPenalty.playerId, game.seasonId, addPenalty.duration);
        
        // Update team and roster stats
        await IncrementPimsForTeamInDatabase(game.team.id, addPenalty.playerId, game.seasonId, addPenalty.duration);
    }
    
    return newPenalty;
};

export const RemovePenaltyFromGame = async (gameId: string, penaltyId: string) => {
    // Check game exists
    const game = await GetGameById(gameId);
    
    // Remove the specific penalty from the game
    const { result, removedPenalty } = await RemovePenaltyFromGameInDatabase(gameId, penaltyId);
    
    // Update player and team PIMS stats (only if not a bench penalty)
    if (removedPenalty.playerId !== 'BENCH') {
        // Update player stats
        await DecrementPimsForPlayerInDatabase(removedPenalty.playerId, game.seasonId, removedPenalty.duration);
        
        // Update team and roster stats
        await DecrementPimsForTeamInDatabase(game.team.id, removedPenalty.playerId, game.seasonId, removedPenalty.duration);
    }
    
    return { message: 'Penalty removed successfully', removedPenalty };
};

export const AddOpponentPenaltyToGame = async (gameId: string, addPenalty: IAddOpponentPenaltyBody) => {
    // Check game exists
    await GetGameById(gameId);
    
    // Add new penalty object to opponent team
    const newPenalty = await AddOpponentPenaltyToGameInDatabase(gameId, addPenalty);
    
    return newPenalty;
};

export const RemoveOpponentPenaltyFromGame = async (gameId: string, penaltyId: string) => {
    // Check game exists
    await GetGameById(gameId);
    
    // Remove the specific opponent penalty from the game
    const { result, removedPenalty } = await RemoveOpponentPenaltyFromGameInDatabase(gameId, penaltyId);
    
    return { message: 'Opponent penalty removed successfully', removedPenalty };
};
