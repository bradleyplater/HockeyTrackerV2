import { ITeam } from '../../src/repository/team.repository';

export const getBasicTeamMock = (): ITeam => ({
    _id: 'TM123456',
    name: 'Team 1',
    players: [
        {
            playerId: 'PL123456',
            number: 1,
        },
        {
            playerId: 'PL456123',
            number: 2,
        },
    ],
});
