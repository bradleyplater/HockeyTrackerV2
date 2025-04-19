import { NextFunction, Request, Response } from 'express';
import { GetAllApiKeys, IApiKey } from '../repository/apiKey.repository';
import bcrypt from 'bcrypt';

// This isn't unit tested, but tested in all integration tests.
export async function ApiKeyValidation(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
        res.status(403).send();
        return;
    }

    const possibleApiKeys: IApiKey[] = (await GetAllApiKeys()) ?? [];

    const validKey = possibleApiKeys.some((key) =>
        bcrypt.compareSync(apiKey, key.key)
    );

    if (!validKey) {
        res.status(403).send();
        return;
    }

    next(); // ✅ Call next() if the API key is valid
}
