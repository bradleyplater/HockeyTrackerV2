import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
    res.send('We are live baby!');
});

export default router;
