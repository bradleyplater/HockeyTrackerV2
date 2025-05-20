export class HockeyTrackerError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number
    ) {
        super(message);
        this.name = 'HockeyTrackerError';
    }
}

// Common errors
export const TeamErrors = {
    TEAM_NOT_FOUND: new HockeyTrackerError(
        'Team not found',
        'TEAM_NOT_FOUND',
        404
    ),
    PLAYER_ALREADY_ON_TEAM: new HockeyTrackerError(
        'Player is already in team',
        'PLAYER_ALREADY_IN_TEAM',
        400
    ),
    PLAYER_NUMBER_IN_USE: new HockeyTrackerError(
        'Player number is already in use',
        'PLAYER_NUMBER_IN_USE',
        400
    ),
};

export const PlayerErrors = {
    PLAYER_NOT_FOUND: new HockeyTrackerError(
        'Player not found',
        'PLAYER_NOT_FOUND',
        404
    ),
};
