import express from 'express';
import swaggerUi from 'swagger-ui-express';
import LivenessRouter from './routes/liveness';
import SeasonsRouter from './routes/seasons';
import PlayerRouter from './routes/player';
import TeamRouter from './routes/team';

import YAML from 'yamljs';
const swaggerDocument = YAML.load('./swagger.yaml');

// Create a new Express.js app
const app = express();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Define your routes and controllers here
app.use('/api/v2/liveness', LivenessRouter);
app.use('/api/v2/seasons', SeasonsRouter);
app.use('/api/v2/player', PlayerRouter);
app.use('/api/v2/team', TeamRouter);

export default app;
