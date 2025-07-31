import express from 'express';
import { ApiKeyValidation } from '../middleware/authentication';
import * as logger from '../helpers/logger';
import { CreateGame } from '../services/game.service';
import { StatusCodes } from 'http-status-codes';
import { commonErrorHandler } from '../helpers/error-helper';
import { IAddGoalBody, IGamePostBody } from '../types/GameTypes';
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
        // const result = await AddGoalToGame(req.body);
        
        res.status(StatusCodes.OK).json({something: "here"}).send();
        return;
    } catch (error) {
        console.log(error);
        logger.LogRouteUnsuccessfulFinished('Add Goal to Game');
        commonErrorHandler(error, res);
    }
});

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

export default router;
