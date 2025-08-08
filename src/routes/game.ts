import express from 'express';
import { ApiKeyValidation } from '../middleware/authentication';
import * as logger from '../helpers/logger';
import { AddGoalToGame, AddOpponentGoalToGame, AddPenaltyToGame, AddOpponentPenaltyToGame, CreateGame, GetAllGames, RemoveGoalFromGame, RemoveOpponentGoalFromGame, RemovePenaltyFromGame, RemoveOpponentPenaltyFromGame } from '../services/game.service';
import { StatusCodes } from 'http-status-codes';
import { commonErrorHandler } from '../helpers/error-helper';
import { IAddGoalBody, IAddOpponentGoalBody, IAddPenaltyBody, IAddOpponentPenaltyBody, IGamePostBody } from '../types/GameTypes';
import {
    isValidName,
    isValidPlayerId,
    isValidSeasonId,
    isValidTeamId,
    isValidTeamName,
} from '../helpers/validation-helper';

const router = express.Router();

router.use(ApiKeyValidation);
router.use(express.json());

router.get('/', async (req, res) => {
    try {
        logger.LogRouteStarted('Get All Games');
        
        const games = await GetAllGames();
        
        logger.LogRouteFinished('Get All Games');
        res.status(StatusCodes.OK).json(games);
    } catch (error) {
        console.log(error);
        logger.LogRouteUnsuccessfulFinished('Get All Games');
        commonErrorHandler(error, res);
    }
});

router.post('/', async (req, res) => {
    try {
        logger.LogRouteStarted('Create Game');

        if (!ValidatePostGameBody(req.body)) {
            logger.LogBadRequest('Invalid Body');
            res.status(StatusCodes.BAD_REQUEST).send();
            return;
        }

        const game = await CreateGame(req.body as IGamePostBody);

        logger.LogRouteFinished('Create Game');
        res.status(StatusCodes.CREATED).json(game).send();
    } catch (error) {
        console.log(error);
        logger.LogRouteUnsuccessfulFinished('Create Game');
        commonErrorHandler(error, res);
    }
});

router.patch('/addgoal/:gameid', async (req, res) => {
    try {
        logger.LogRouteStarted('Add Goal to Game');

        if(!ValidateAddGoalToGameBody(req.body)) {
            logger.LogBadRequest('Invalid Body');
            res.status(StatusCodes.BAD_REQUEST).send();
            return;
        }

        // Add your actual game service logic here
        // Add service to update player stats based on goal
        // Update create-game to add team stats the same way it does player stats.
        // Update Team Stats
        const result = await AddGoalToGame(req.params.gameid, req.body);
        
        logger.LogRouteFinished('Add Goal to Game');
        res.status(StatusCodes.CREATED).send();
        return;
    } catch (error) {
        console.log(error);
        logger.LogRouteUnsuccessfulFinished('Add Goal to Game');
        commonErrorHandler(error, res);
    }
});

router.patch('/removegoal/:gameid/:goalid', async (req, res) => {
    try {
        const gameId = req.params.gameid;
        const goalId = req.params.goalid;

        const updatedGame = await RemoveGoalFromGame(gameId, goalId);

        res.status(200).json({ message: 'Goal removed successfully', game: updatedGame });
    } catch (error) {
        console.log(error);
        logger.LogRouteUnsuccessfulFinished('Remove Goal to Game');
        commonErrorHandler(error, res);
    }
});

router.patch('/addopponentgoal/:gameid', async (req, res) => {
    try {
        logger.LogRouteStarted('Add Opponent Goal');
        
        const gameId = req.params.gameid;
        const addGoalBody: IAddOpponentGoalBody = req.body;
        
        if (!ValidateAddOpponentGoalBody(addGoalBody)) {
            logger.LogBadRequest('Invalid Body');
            res.status(StatusCodes.BAD_REQUEST).send();
            return;
        }
        
        const result = await AddOpponentGoalToGame(gameId, addGoalBody);
        
        logger.LogRouteFinished('Add Opponent Goal');
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        console.log(error);
        logger.LogRouteUnsuccessfulFinished('Add Opponent Goal');
        commonErrorHandler(error, res);
    }
});

router.patch('/removeopponentgoal/:gameid/:goalid', async (req, res) => {
    try {
        logger.LogRouteStarted('Remove Opponent Goal');
        
        const gameId = req.params.gameid;
        const goalId = req.params.goalid;
        
        const result = await RemoveOpponentGoalFromGame(gameId, goalId);
        
        logger.LogRouteFinished('Remove Opponent Goal');
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        console.log(error);
        logger.LogRouteUnsuccessfulFinished('Remove Opponent Goal');
        commonErrorHandler(error, res);
    }
});

const ValidateAddOpponentGoalBody = (body: IAddOpponentGoalBody): boolean => {
    if (!body.scoredBy || typeof body.scoredBy !== 'string' || body.scoredBy.trim() === '') {
        console.log('Invalid scoredBy', body.scoredBy);
        return false;
    }
    
    if (typeof body.minute !== 'number' || body.minute < 0 || body.minute > 60) {
        console.log('Invalid minute', body.minute);
        return false;
    }
    
    if (typeof body.second !== 'number' || body.second < 0 || body.second > 59) {
        console.log('Invalid second', body.second);
        return false;
    }
    
    if (!body.type || !['EVEN', 'SH', 'PP'].includes(body.type)) {
        console.log('Invalid type', body.type);
        return false;
    }
    
    return true;
};

const ValidateAddGoalToGameBody = (body: IAddGoalBody): boolean => {
    // Validate minute (should be between 0-60 for hockey periods)
    if (body.minute === undefined || body.minute === null || 
        typeof body.minute !== 'number' || 
        body.minute < 0 || body.minute > 60) {
        console.log('Invalid Minute', body.minute);
        return false;
    }

    // Validate second (should be between 0-59)
    if (body.second === undefined || body.second === null || 
        typeof body.second !== 'number' || 
        body.second < 0 || body.second > 59) {
        console.log('Invalid Second', body.second);
        return false;
    }

    // Validate goal type (must be one of the allowed GoalTypes)
    const validGoalTypes = ['EVEN', 'SH', 'PP'];
    if (!body.type || !validGoalTypes.includes(body.type)) {
        console.log('Invalid Goal Type', body.type);
        return false;
    }

    // Validate scoredBy player ID
    if (!isValidPlayerId(body.scoredBy)) {
        console.log('Invalid Scored By Player ID', body.scoredBy);
        return false;
    }

    // Validate assist1 player ID (can be empty string for no assist)
    if (body.assist1 && !isValidPlayerId(body.assist1)) {
        console.log('Invalid Assist1 Player ID', body.assist1);
        return false;
    }

    // Validate assist2 player ID (can be empty string for no assist)
    if (body.assist2 && !isValidPlayerId(body.assist2)) {
        console.log('Invalid Assist2 Player ID', body.assist2);
        return false;
    }

    // Ensure scoredBy is different from assists (a player can't assist their own goal)
    if (body.assist1 && body.scoredBy === body.assist1) {
        console.log('Player cannot assist their own goal', body.scoredBy);
        return false;
    }

    if (body.assist2 && body.scoredBy === body.assist2) {
        console.log('Player cannot assist their own goal', body.scoredBy);
        return false;
    }

    // Ensure assist1 and assist2 are different players
    if (body.assist1 && body.assist2 && body.assist1 === body.assist2) {
        console.log('Assist1 and Assist2 cannot be the same player', body.assist1);
        return false;
    }

    return true;
};

const ValidatePostGameBody = (body: IGamePostBody): boolean => {
    const date = new Date(body.date);
    if (isNaN(date.getTime())) {
        console.log('Invalid Date', body.date);
        return false;
    }

    if (!isValidTeamName(body.opponentName)) {
        console.log('Invalid Opponent Team', body.opponentName);
        return false;
    }

    if (!isValidTeamId(body.team)) {
        console.log('Invalid Team', body.team);
        return false;
    }

    if (!isValidSeasonId(body.seasonId)) {
        console.log('Invalid Season id', body.seasonId);
        return false;
    }

    if (!body.teamRoster) {
        console.log('Invalid Team Roster', body.teamRoster);
        return false;
    }

    const invalidPlayers = body.teamRoster.filter((playerId) => {
        return !isValidPlayerId(playerId);
    });

    if (invalidPlayers.length > 0) {
        console.log('Invalid Players', invalidPlayers);
        return false;
    }

    // Potentially validate against duplicate players

    return true;
};

// Add penalty endpoint
router.patch('/addpenalty/:gameid', async (req, res) => {
    try {
        logger.LogRouteStarted('Add Penalty to Game');
        
        const gameId = req.params.gameid;
        const body: IAddPenaltyBody = req.body;
        
        // Validate request body
        if (!isValidAddPenaltyBody(body)) {
            logger.LogBadRequest('Invalid Body');
            res.status(StatusCodes.BAD_REQUEST).send();
            return;
        }
        
        const result = await AddPenaltyToGame(gameId, body);
        
        logger.LogRouteFinished('Add Penalty to Game');
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        console.log(error);
        logger.LogRouteUnsuccessfulFinished('Add Penalty to Game');
        commonErrorHandler(error, res);
    }
});

// Remove penalty endpoint
router.patch('/removepenalty/:gameid/:penaltyid', async (req, res) => {
    try {
        logger.LogRouteStarted('Remove Penalty from Game');
        
        const gameId = req.params.gameid;
        const penaltyId = req.params.penaltyid;
        
        const result = await RemovePenaltyFromGame(gameId, penaltyId);
        
        logger.LogRouteFinished('Remove Penalty from Game');
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        console.log(error);
        logger.LogRouteUnsuccessfulFinished('Remove Penalty from Game');
        commonErrorHandler(error, res);
    }
});

// Add opponent penalty endpoint
router.patch('/addopponentpenalty/:gameid', async (req, res) => {
    try {
        logger.LogRouteStarted('Add Opponent Penalty to Game');
        
        const gameId = req.params.gameid;
        const body: IAddOpponentPenaltyBody = req.body;
        
        // Validate request body
        if (!isValidAddOpponentPenaltyBody(body)) {
            logger.LogBadRequest('Invalid Body');
            res.status(StatusCodes.BAD_REQUEST).send();
            return;
        }
        
        const result = await AddOpponentPenaltyToGame(gameId, body);
        
        logger.LogRouteFinished('Add Opponent Penalty to Game');
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        console.log(error);
        logger.LogRouteUnsuccessfulFinished('Add Opponent Penalty to Game');
        commonErrorHandler(error, res);
    }
});

// Remove opponent penalty endpoint
router.patch('/removeopponentpenalty/:gameid/:penaltyid', async (req, res) => {
    try {
        logger.LogRouteStarted('Remove Opponent Penalty from Game');
        
        const gameId = req.params.gameid;
        const penaltyId = req.params.penaltyid;
        
        const result = await RemoveOpponentPenaltyFromGame(gameId, penaltyId);
        
        logger.LogRouteFinished('Remove Opponent Penalty from Game');
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        console.log(error);
        logger.LogRouteUnsuccessfulFinished('Remove Opponent Penalty from Game');
        commonErrorHandler(error, res);
    }
});

// Validation functions for penalty bodies
const isValidAddPenaltyBody = (body: any): body is IAddPenaltyBody => {
    if (!body || typeof body !== 'object') {
        return false;
    }
    
    // Check required fields
    if (typeof body.minute !== 'number' || body.minute < 0 || body.minute > 60) {
        return false;
    }
    
    if (typeof body.second !== 'number' || body.second < 0 || body.second > 59) {
        return false;
    }
    
    if (typeof body.duration !== 'number' || body.duration <= 0) {
        return false;
    }
    
    if (!body.type || typeof body.type !== 'string') {
        return false;
    }
    
    // playerId can be a valid player ID or "BENCH"
    if (!body.playerId || (typeof body.playerId !== 'string')) {
        return false;
    }
    
    if (body.playerId !== 'BENCH' && !isValidPlayerId(body.playerId)) {
        return false;
    }
    
    return true;
};

const isValidAddOpponentPenaltyBody = (body: any): body is IAddOpponentPenaltyBody => {
    if (!body || typeof body !== 'object') {
        return false;
    }
    
    // Check required fields
    if (typeof body.minute !== 'number') {
        return false;
    }
    
    if (typeof body.second !== 'number') {
        return false;
    }
    
    if (typeof body.duration !== 'number' || body.duration <= 0) {
        return false;
    }
    
    if (!body.type || typeof body.type !== 'string') {
        return false;
    }
    
    // playerName can be a player name or "BENCH"
    if (!body.playerName || typeof body.playerName !== 'string') {
        return false;
    }
    
    return true;
};

export default router;
