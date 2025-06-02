import * as PlayerRepository from '../../../repository/player.repository';
import * as IdHelper from '../../../helpers/id-helper';
import { addPlayerToDatabase } from '../../../services/player.service';

describe('PlayerService', () => {
    const testCases = [
        {
            firstName: 'John',
            surname: 'Doe',
        },
        {
            firstName: 'Derek',
            surname: 'Smith',
        },
        {
            firstName: 'Jane',
            surname: 'Doe',
        },
    ];

    it.each(testCases)(
        'Should call InsertPlayerToDatabase with firstname: $firstName, surname: $surname',
        async ({ firstName, surname }) => {
            const insertPlayerToDatabaseSpy = jest
                .spyOn(PlayerRepository, 'InsertPlayerToDatabase')
                .mockResolvedValue({
                    _id: 'PLR123456',
                    firstName,
                    surname,
                    teams: [],
                });

            jest.spyOn(IdHelper, 'generateIdWithPrefix').mockReturnValue(
                'PLR123456'
            );

            const expectedResult: PlayerRepository.IPlayer = {
                _id: 'PLR123456',
                firstName,
                surname,
                teams: [],
            };

            await addPlayerToDatabase(firstName, surname);

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

        await expect(addPlayerToDatabase('John', 'Doe')).rejects.toThrow(
            testError
        );
    });
});
