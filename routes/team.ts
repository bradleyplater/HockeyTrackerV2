import express from 'express';
import { isValidName, isValidTeamName } from '../helpers/validation-helper';
import { ApiKeyValidation } from '../middleware/authentication';
import { StatusCodes } from 'http-status-codes';
import * as logger from '../helpers/logger';
import { addTeamToDatabase } from '../services/team.service';
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

function ValidatePostTeamBody(team: { name: string }): boolean {
    return isValidTeamName(team.name);
}

export default router;
