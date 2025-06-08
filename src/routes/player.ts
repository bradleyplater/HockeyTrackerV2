import express from 'express';
import { isValidName, isValidPlayerId } from '../helpers/validation-helper';
import { ApiKeyValidation } from '../middleware/authentication';
import {
    GetAllPlayersFromDatabase,
    GetPlayerByIdFromDatabase,
    IPlayer,
    RemovePlayerByIdFromDatabase,
    UpdatePlayerDetailsByIdFromDatabase,
} from '../repository/player.repository';
import { addPlayerToDatabase } from '../services/player.service';
import { StatusCodes } from 'http-status-codes';
import * as logger from '../helpers/logger';
import { commonErrorHandler } from '../helpers/error-helper';
const router = express.Router();

router.use(ApiKeyValidation);
router.use(express.json());

router.post('/', async (req, res) => {
    try {
        logger.LogRouteStarted('Create Player');
        const body = req.body as IPlayer;

        if (!ValidatePostPlayerBody(body)) {
            logger.LogBadRequest('Invalid Body');
            res.status(StatusCodes.BAD_REQUEST).send();
            return;
        }

        const player = await addPlayerToDatabase(body.firstName, body.surname);

        logger.LogRouteFinished('Create Player');
        res.status(StatusCodes.CREATED).json(player).send();
    } catch (error) {
        console.log(error);
        logger.LogRouteUnsuccessfulFinished('Create Player');
        commonErrorHandler(error, res);
    }
});

router.get('/', async (req, res) => {
    try {
        logger.LogRouteStarted('Get All Players');
        const players = await GetAllPlayersFromDatabase();

        logger.LogRouteFinished('Get All Players');
        res.status(StatusCodes.OK).json(players).send();
    } catch (error) {
        console.log(error);
        logger.LogRouteUnsuccessfulFinished('Get All Players');

        commonErrorHandler(error, res);
    }
});

router.get('/:playerId', async (req, res) => {
    try {
        logger.LogRouteStarted('Get Player By Id');
        const { playerId } = req.params;

        if (!isValidPlayerId(playerId)) {
            logger.LogBadRequest('Invalid PlayerId');
            res.status(StatusCodes.BAD_REQUEST).send();
            return;
        }

        const player = await GetPlayerByIdFromDatabase(playerId);

        logger.LogRouteFinished('Get Player By Id');
        res.status(StatusCodes.OK).json(player).send();
    } catch (error) {
        console.log(error);
        logger.LogRouteUnsuccessfulFinished('Get Player By Id');
        commonErrorHandler(error, res);
    }
});

router.delete('/:playerId', async (req, res) => {
    try {
        logger.LogRouteStarted('Delete Player');
        const { playerId } = req.params;

        if (!isValidPlayerId(playerId)) {
            logger.LogBadRequest('Invalid Player Id');
            res.status(StatusCodes.BAD_REQUEST).send();
            return;
        }

        await RemovePlayerByIdFromDatabase(playerId);

        logger.LogRouteFinished('Delete Player');
        res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
        console.log(error);

        commonErrorHandler(error, res);
    }
});

router.patch('/:playerId/details', async (req, res) => {
    try {
        logger.LogRouteStarted('Updating Player Details');
        const { playerId } = req.params;
        const updatedPlayer = req.body as IPlayer;

        if (!isValidPlayerId(playerId)) {
            logger.LogBadRequest('Invalid Player Id');
            res.status(StatusCodes.BAD_REQUEST).send();
            return;
        }

        if (!ValidatePostPlayerBody(updatedPlayer)) {
            logger.LogBadRequest('Invalid Body');
            res.status(StatusCodes.BAD_REQUEST).send();
            return;
        }

        await UpdatePlayerDetailsByIdFromDatabase(playerId, updatedPlayer);

        logger.LogRouteFinished('Updating Player Details');
        res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
        console.log(error);

        commonErrorHandler(error, res);
    }
});

function ValidatePostPlayerBody(player: {
    firstName: string;
    surname: string;
}): boolean {
    return isValidName(player.firstName) && isValidName(player.surname);
}

export default router;
