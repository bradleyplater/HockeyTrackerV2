import express from 'express';
import { ApiKeyValidation } from '../middleware/authentication';
import * as logger from '../helpers/logger';
import { CreateGame } from '../services/game.service';
import { StatusCodes } from 'http-status-codes';
import { commonErrorHandler } from '../helpers/error-helper';

const router = express.Router();

router.use(ApiKeyValidation);
router.use(express.json());

router.post('/', async (req, res) => {
    try {
        logger.LogRouteStarted('Create Game');

        // if (!ValidatePostTeamBody(body)) {
        //     logger.LogBadRequest('Invalid Body');
        //     res.status(StatusCodes.BAD_REQUEST).send();
        //     return;
        // }

        const game = await CreateGame();

        logger.LogRouteFinished('Create Game');
        res.status(StatusCodes.CREATED).json(game).send();
    } catch (error) {
        console.log(error);
        logger.LogRouteUnsuccessfulFinished('Create Game');
        commonErrorHandler(error, res);
    }
});

export default router;
