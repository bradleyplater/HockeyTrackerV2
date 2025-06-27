import express from 'express';
import { ApiKeyValidation } from '../middleware/authentication';
import * as logger from '../helpers/logger';
import { CreateGame } from '../services/game.service';
import { StatusCodes } from 'http-status-codes';
import { commonErrorHandler } from '../helpers/error-helper';
import { IGamePostBody } from '../types/GameTypes';
import {
    isValidName,
    isValidPlayerId,
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

        const game = await CreateGame();

        logger.LogRouteFinished('Create Game');
        res.status(StatusCodes.CREATED).json(game).send();
    } catch (error) {
        console.log(error);
        logger.LogRouteUnsuccessfulFinished('Create Game');
        commonErrorHandler(error, res);
    }
});

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

    return true;
};

export default router;
