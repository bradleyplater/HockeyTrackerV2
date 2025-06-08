import express from 'express';
import { GetAllSeasons } from '../repository/seasons.repository';
const router = express.Router();

router.use(express.json());

router.get('/', async (req, res) => {
    try {
        const seasons = await GetAllSeasons();

        res.json(seasons).send();
    } catch (error) {
        console.log(error);

        res.status(500).send();
    }
});

export default router;
