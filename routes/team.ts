import express from 'express';
import {
    isValidName,
    isValidPlayerId,
    isValidTeamName,
} from '../helpers/validation-helper';
import { ApiKeyValidation } from '../middleware/authentication';
import { StatusCodes } from 'http-status-codes';
import * as logger from '../helpers/logger';
import { addTeamToDatabase } from '../services/team.service';
import { GetAllTeamsFromDatabase } from '../repository/team.repository';
const router = express.Router();

router.use(ApiKeyValidation);
router.use(express.json());

router.post('/', async (req, res) => {
    try {
        logger.LogRouteStarted('Create Team');
        const body = req.body as { name: string };

        if (!ValidatePostTeamBody(body)) {
            logger.LogBadRequest('Invalid Body');
            res.status(StatusCodes.BAD_REQUEST).send();
            return;
        }

        const team = await addTeamToDatabase(body.name);

        logger.LogRouteFinished('Create Team');
        res.status(StatusCodes.CREATED).json(team).send();
    } catch (error) {
        console.log(error);
        logger.LogRouteUnsuccessfulFinished('Create Team');
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
});

router.get('/', async (req, res) => {
    try {
        logger.LogRouteStarted('Get All Teams');
        const teams = await GetAllTeamsFromDatabase();

        if (teams === undefined || teams === null) {
            logger.LogRouteUnsuccessfulFinished('Get All Teams (No Teams)');
            res.status(StatusCodes.NOT_FOUND).send();
            return;
        }

        logger.LogRouteFinished('Get All Teams');
        res.status(StatusCodes.OK).json(teams).send();
    } catch (error) {
        console.log(error);
        logger.LogRouteUnsuccessfulFinished(
            'Get All Teams (Internal Server Error)'
        );
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
});

// router.patch('/addplayer/:teamid', async (req, res) => {
//     try {
//         logger.LogRouteStarted('Add Player to Team');

//         // validate body
//         if (ValidateAddPlayerToTeamBody(req.body)) {
//             logger.LogBadRequest('Invalid Body');
//             res.status(StatusCodes.BAD_REQUEST).send();
//             return;
//         }

//         // call service to add player to the team

//         // return 200

//         logger.LogRouteFinished('Get All Teams');
//         res.status(StatusCodes.OK).json().send();
//     } catch (error) {
//         console.log(error);
//         logger.LogRouteUnsuccessfulFinished(
//             'Get All Teams (Internal Server Error)'
//         );
//         res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
//     }
// });

function ValidatePostTeamBody(team: { name: string }): boolean {
    return isValidTeamName(team.name);
}

function ValidateAddPlayerToTeamBody(player: {
    playerId: string;
    number: number;
}): boolean {
    return (
        isValidPlayerId(player.playerId) &&
        player.number != null &&
        player.number != undefined
    );
}
export default router;
