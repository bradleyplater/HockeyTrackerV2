import { IPlayer } from '../../src/repository/player.repository';

export const basicPlayerMock: IPlayer = {
    _id: 'PLR123456',
    firstName: 'John',
    surname: 'Doe',
    position: 'Forward',
    teams: [],
    stats: [],
};
