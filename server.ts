import express from 'express';
import swaggerUi from 'swagger-ui-express';
import LivenessRouter from './routes/liveness';
import YAML from 'yamljs';
const swaggerDocument = YAML.load('./swagger.yaml');

// Create a new Express.js app
const app = express();
// Configure the app to use Swagger
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'My Express.js API',
            version: '1.0.0',
            description:
                'A sample Express.js API built with TypeScript and Swagger',
        },
    },
    apis: ['./routes/*.ts'],
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// Define your routes and controllers here

app.use('/api/v2/liveness', LivenessRouter);

// Start the Express.js app
app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
