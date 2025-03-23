import express from 'express';
import swaggerUi from 'swagger-ui-express';
import LivenessRouter from './routes/liveness';
import SeasonsRouter from './routes/seasons';

import YAML from 'yamljs';
const swaggerDocument = YAML.load('./swagger.yaml');

// Create a new Express.js app
const app = express();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Define your routes and controllers here
app.use('/api/v2/liveness', LivenessRouter);
app.use('/api/v2/seasons', SeasonsRouter);

export default app;
