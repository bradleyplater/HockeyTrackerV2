import { connectToDatabase } from './src/repository/database';
import app from './server';

connectToDatabase()
    .then(() => {
        // Start the Express.js app
        app.listen(3000, () => {
            console.log('Server started on http://localhost:3000');
        });
    })
    .catch((error) => {
        console.error('Database connection failed', error);
        process.exit();
    });
