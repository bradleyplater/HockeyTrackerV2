import express from 'express';
import { isValidPlayerId, isValidTeamName } from '../helpers/validation-helper';
import { ApiKeyValidation } from '../middleware/authentication';
import { StatusCodes } from 'http-status-codes';
import * as logger from '../helpers/logger';
import {
    addPlayerToTeam,
    addTeamToDatabase,
    removePlayerFromTeam,
    updatePlayerNumber,
} from '../services/team.service';
import { GetAllTeamsFromDatabase } from '../repository/team.repository';
import { commonErrorHandler } from '../helpers/error-helper';
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
        commonErrorHandler(error, res);
    }
});

router.get('/', async (req, res) => {
    try {
        logger.LogRouteStarted('Get All Teams');
        const teams = await GetAllTeamsFromDatabase();

        logger.LogRouteFinished('Get All Teams');
        res.status(StatusCodes.OK).json(teams).send();
    } catch (error) {
        console.log(error);
        logger.LogRouteUnsuccessfulFinished(
            'Get All Teams (Internal Server Error)'
        );
        commonErrorHandler(error, res);
    }
});

router.patch('/addplayer/:teamid', async (req, res) => {
    try {
        logger.LogRouteStarted('Add Player to Team');

        // validate body
        if (!ValidateAddPlayerToTeamBody(req.body)) {
            logger.LogBadRequest('Invalid Body');
            res.status(StatusCodes.BAD_REQUEST).send();
            return;
        }

        // call service to add player to the team
        const team = await addPlayerToTeam(
            req.params.teamid,
            req.body.playerId,
            req.body.number
        );

        logger.LogRouteFinished('Add Player to Team');
        res.status(StatusCodes.OK).json(team).send();
    } catch (error) {
        console.log(error);
        logger.LogRouteUnsuccessfulFinished(
            'Get All Teams (Internal Server Error)'
        );

        commonErrorHandler(error, res);
    }
});

router.patch('/removeplayer/:teamid', async (req, res) => {
    try {
        logger.LogRouteStarted('Remove player from Team');

        const playerId = req.body.playerId as string;

        // validate body
        if (!isValidPlayerId(playerId)) {
            logger.LogBadRequest('Invalid Body');
            res.status(StatusCodes.BAD_REQUEST).send();
            return;
        }

        // call service to add player to the team
        await removePlayerFromTeam(req.params.teamid, req.body.playerId);

        logger.LogRouteFinished('Remove Player from Team');
        res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
        console.log(error);
        logger.LogRouteUnsuccessfulFinished(
            'Get All Teams (Internal Server Error)'
        );

        commonErrorHandler(error, res);
    }
});

router.patch('/updateplayer/:teamid/number', async (req, res) => {
    try {
        logger.LogRouteStarted('Update Player Number in Team');

        const teamId = req.params.teamid;
        const body = req.body as { playerId: string; number: number };

        if (!ValidateUpdatePlayerNumberBody(body)) {
            logger.LogBadRequest('Invalid Body');
            res.status(StatusCodes.BAD_REQUEST).send();
            return;
        }

        const team = await updatePlayerNumber(
            teamId,
            body.playerId,
            body.number
        );

        logger.LogRouteFinished('Update Player Number in Team');
        res.status(StatusCodes.OK).json(team).send();
    } catch (error) {
        console.log(error);
        logger.LogRouteUnsuccessfulFinished('Update Player Number in Team');
        commonErrorHandler(error, res);
    }
});

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

function ValidateUpdatePlayerNumberBody(body: {
    playerId: string;
    number: number;
}): boolean {
    return (
        isValidPlayerId(body.playerId) &&
        body.number != null &&
        body.number != undefined &&
        typeof body.number === 'number'
    );
}

export default router;
