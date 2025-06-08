import express from 'express';
const router = express.Router();

router.use(express.json());

router.get('/', (req, res) => {
    res.send('We are live baby!');
});

export default router;
