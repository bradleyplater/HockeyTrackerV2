import express from 'express';
import { isValidName, isValidPlayerId } from '../helpers/validation-helper';
import { ApiKeyValidation } from '../middleware/authentication';
import {
    GetAllPlayersFromDatabase,
    GetPlayerByIdFromDatabase,
    IPlayer,
} from '../repository/player.repository';
import { addPlayerToDatabase } from '../services/player.service';
import { StatusCodes } from 'http-status-codes';
const router = express.Router();

router.use(ApiKeyValidation);
router.use(express.json());

router.post('/', async (req, res) => {
    try {
        const body = req.body as IPlayer;

        if (!ValidatePostPlayerBody(body)) {
            res.status(StatusCodes.BAD_REQUEST).send();
            return;
        }

        const player = await addPlayerToDatabase(body.firstName, body.surname);

        res.status(StatusCodes.CREATED).json(player).send();
    } catch (error) {
        console.log(error);

        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
});

router.get('/', async (req, res) => {
    try {
        const players = await GetAllPlayersFromDatabase();

        if (players === undefined || players === null) {
            res.status(StatusCodes.NOT_FOUND).send();
        }

        res.status(StatusCodes.OK).json(players).send();
    } catch (error) {
        console.log(error);

        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
});

router.get('/:playerId', async (req, res) => {
    try {
        const { playerId } = req.params;

        if (!isValidPlayerId(playerId)) {
            console.log('Bad Request: Invalid Player Id');
            res.status(StatusCodes.BAD_REQUEST).send();
            return;
        }

        const player = await GetPlayerByIdFromDatabase(playerId);

        if (player === undefined || player === null) {
            res.status(StatusCodes.NOT_FOUND).send();
        }

        res.status(StatusCodes.OK).json(player).send();
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
