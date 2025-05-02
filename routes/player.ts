import express from 'express';
import { isValidName, isValidPlayerId } from '../helpers/validation-helper';
import { ApiKeyValidation } from '../middleware/authentication';
import {
    GetAllPlayersFromDatabase,
    GetPlayerByIdFromDatabase,
    IPlayer,
    RemovePlayerByIdFromDatabase,
} from '../repository/player.repository';
import { addPlayerToDatabase } from '../services/player.service';
import { StatusCodes } from 'http-status-codes';
import * as logger from '../helpers/logger';
import { log } from 'console';
const router = express.Router();

router.use(ApiKeyValidation);
router.use(express.json());

/*
ADD LOGS FOR WHEN ROUTE IS STARTED AND WHY IT MIGHT BREAK
*/

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
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
});

router.get('/', async (req, res) => {
    try {
        logger.LogRouteStarted('Get All Players');
        const players = await GetAllPlayersFromDatabase();

        if (players === undefined || players === null) {
            logger.LogRouteUnsuccessfulFinished('Get All Players (No Players)');
            res.status(StatusCodes.NOT_FOUND).send();
        }

        logger.LogRouteFinished('Get All Players');
        res.status(StatusCodes.OK).json(players).send();
    } catch (error) {
        console.log(error);
        logger.LogRouteUnsuccessfulFinished('Get All Players');

        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
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

        if (player === undefined || player === null) {
            logger.LogRouteUnsuccessfulFinished(
                'Get Player By Id (No Player Exists)'
            );
            res.status(StatusCodes.NOT_FOUND).send();
            return;
        }

        logger.LogRouteFinished('Get Player By Id');
        res.status(StatusCodes.OK).json(player).send();
    } catch (error) {
        console.log(error);
        logger.LogRouteUnsuccessfulFinished('Get Player By Id');
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
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

        const deleteResponse = await RemovePlayerByIdFromDatabase(playerId);

        if (deleteResponse === undefined || deleteResponse === null) {
            throw new Error('Mongo Failed to delete');
        } else if (deleteResponse.deletedCount === 0) {
            logger.LogBadRequest('No player found to delete');
            res.status(StatusCodes.NOT_FOUND).send();
            return;
        }

        logger.LogRouteFinished('Delete Player');
        res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
        console.log(error);

        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
});

function ValidatePostPlayerBody(player: {
    firstName: string;
    surname: string;
}): boolean {
    return isValidName(player.firstName) && isValidName(player.surname);
}

export default router;
