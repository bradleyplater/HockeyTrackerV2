import express from 'express';
import swaggerUi from 'swagger-ui-express';
import LivenessRouter from './routes/liveness';
import YAML from 'yamljs';
const swaggerDocument = YAML.load('./swagger.yaml');

// Create a new Express.js app
const app = express();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Define your routes and controllers here
app.use('/api/v2/liveness', LivenessRouter);

export default app;
