import express from 'express';
import { isValidName } from '../helpers/validation-helper';
import { ApiKeyValidation } from '../middleware/authentication';
const router = express.Router();

router.use(ApiKeyValidation);
router.use(express.json());

interface Player {
    firstName: string;
    surname: string;
}

router.post('/', async (req, res) => {
    try {
        const body = req.body as Player;

        if (!ValidatePostPlayerBody(body)) {
            res.status(400).send();
            return;
        }

        res.json().send();
    } catch (error) {
        console.log(error);

        res.status(500).send();
    }
});

function ValidatePostPlayerBody(player: {
    firstName: string;
    surname: string;
}): boolean {
    return isValidName(player.firstName) && isValidName(player.surname);
}

export default router;
