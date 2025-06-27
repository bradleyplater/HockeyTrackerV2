import {
    IGame,
    IGameOpponentGoals,
    IGameOpponentPenalty,
    IGamePlayer,
    IGameScore,
    IGameTeamGoals,
    IGameTeamPenalty,
} from '../../src/types/GameTypes';

export const generateGameMock = (): IGame => {
    const mockPlayers: IGamePlayer[] = [
        {
            playerId: 'player-1',
            teamId: 'team-1',
            stats: {
                goals: 2,
                assists: 1,
                pims: 4,
            },
        },
        {
            playerId: 'player-2',
            teamId: 'team-1',
            stats: {
                goals: 1,
                assists: 2,
                pims: 2,
            },
        },
    ];

    const mockTeamGoals: IGameTeamGoals[] = [
        {
            minute: 4,
            second: 12,
            scoredBy: 'player-1',
            assist1: 'player-2',
            assist2: 'player-2',
            type: 'EVEN',
        },
        {
            minute: 15,
            second: 33,
            scoredBy: 'player-2',
            assist1: 'player-1',
            assist2: 'player-1',
            type: 'PP',
        },
    ];

    const mockTeamPenalties: IGameTeamPenalty[] = [
        {
            minute: 5,
            second: 0,
            playerId: 'player-1',
            type: 'HOOK',
            duration: 2,
        },
        {
            minute: 11,
            second: 45,
            playerId: 'player-2',
            type: 'SLASH',
            duration: 2,
        },
    ];

    const mockOpponentGoals: IGameOpponentGoals[] = [
        {
            minute: 9,
            second: 20,
            name: 'Opponent Player 1',
            type: 'SH',
        },
        {
            minute: 17,
            second: 5,
            name: 'Opponent Player 2',
            type: 'EVEN',
        },
    ];

    const mockOpponentPenalties: IGameOpponentPenalty[] = [
        {
            minute: 6,
            second: 30,
            name: 'Opponent Player 1',
            type: 'TRIP',
            duration: 2,
        },
        {
            minute: 13,
            second: 10,
            name: 'Opponent Player 2',
            type: 'ROUGH',
            duration: 2,
        },
    ];

    const mockScore: IGameScore = {
        team: 2,
        opponent: 2,
        periods: [
            {
                number: 1,
                team: 2,
                opponent: 2,
            },
        ],
    };

    return {
        _id: 'game-1',
        date: new Date('2025-06-15T12:12:00.029Z'),
        team: {
            id: 'team-1',
            roster: mockPlayers,
            goals: mockTeamGoals,
            penalties: mockTeamPenalties,
        },
        opponentTeam: {
            name: 'The Visitors',
            goals: mockOpponentGoals,
            penalties: mockOpponentPenalties,
        },
        score: mockScore,
    };
};

export const generateGameResponse = () => {
    const response = generateGameMock() as any;
    response.date = response.date.toISOString();
    return response;
};
