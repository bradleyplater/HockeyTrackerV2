import * as PlayerRepository from '../../../src/repository/player.repository';
import * as IdHelper from '../../../src/helpers/id-helper';
import {
    addGameToPlayers,
    addPlayerToDatabase,
} from '../../../src/services/player.service';

describe('PlayerService', () => {
    const testCases = [
        {
            firstName: 'John',
            surname: 'Doe',
            position: 'Forward',
        },
        {
            firstName: 'Derek',
            surname: 'Smith',
            position: 'Defense',
        },
        {
            firstName: 'Jane',
            surname: 'Doe',
            position: 'Goalie',
        },
    ];

    it.each(testCases)(
        'Should call InsertPlayerToDatabase with firstname: $firstName, surname: $surname, position: $position',
        async ({ firstName, surname, position }) => {
            const insertPlayerToDatabaseSpy = jest
                .spyOn(PlayerRepository, 'InsertPlayerToDatabase')
                .mockResolvedValue({
                    _id: 'PLR123456',
                    firstName,
                    surname,
                    position,
                    teams: [],
                    stats: [],
                });

            jest.spyOn(IdHelper, 'generateIdWithPrefix').mockReturnValue(
                'PLR123456'
            );

            const expectedResult: PlayerRepository.IPlayer = {
                _id: 'PLR123456',
                firstName,
                surname,
                position,
                teams: [],
                stats: [],
            };

            await addPlayerToDatabase(firstName, surname, position);

            expect(insertPlayerToDatabaseSpy).toHaveBeenCalledWith(
                expectedResult
            );
        }
    );

    it('Should rethrow error when InsertPlayerToDatabase fails', async () => {
        const testError = new Error('Database error');

        jest.spyOn(
            PlayerRepository,
            'InsertPlayerToDatabase'
        ).mockRejectedValue(testError);

        jest.spyOn(IdHelper, 'generateIdWithPrefix').mockReturnValue(
            'PLR123456'
        );

        await expect(addPlayerToDatabase('John', 'Doe', 'Forward')).rejects.toThrow(
            testError
        );
    });

    describe('addGameToPlayers', () => {
        // Finish writing tests for this function
        it("should call mongo with correct list when player doesn't have stat object", async () => {
            const roster = ['PLR123456'];
            const player: PlayerRepository.IPlayer = {
                _id: 'PLR123456',
                firstName: 'John',
                surname: 'Doe',
                position: 'Forward',
                teams: [],
                stats: [],
            };
            const seasonId = 'SSN123456';

            const AddStatsObjectToPlayersInDatabaseSpy = jest.spyOn(PlayerRepository, 'AddStatsObjectToPlayersInDatabase')

            addGameToPlayers(roster, [player], seasonId);

            expect(AddStatsObjectToPlayersInDatabaseSpy).toHaveBeenCalledWith(['PLR123456'], seasonId);
        });
    });
});
