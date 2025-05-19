import * as TeamRepository from '../../../repository/team.repository';
import * as IdHelper from '../../../helpers/id-helper';
import { addTeamToDatabase } from '../../../services/team.service';

describe('TeamService', () => {
    const testCases = [
        {
            name: 'Peterborough Warriors',
        },
        {
            name: 'Peterborough Preds',
        },
        {
            name: 'Pollington Nomads',
        },
    ];

    it.each(testCases)(
        'Should call InsertTeamToDatabase with correct name: $name',
        async ({ name }) => {
            const insertTeamToDatabaseSpy = jest
                .spyOn(TeamRepository, 'InsertTeamToDatabase')
                .mockResolvedValue({
                    _id: 'TM123456',
                    name,
                    players: [],
                });

            jest.spyOn(IdHelper, 'generateIdWithPrefix').mockReturnValue(
                'TM123456'
            );

            const expectedResult = {
                _id: 'TM123456',
                name,
                players: [],
            };

            await addTeamToDatabase(name);

            expect(insertTeamToDatabaseSpy).toHaveBeenCalledWith(
                expectedResult
            );
        }
    );

    it('Should rethrow error when InsertTeamToDatabase fails', async () => {
        const testError = new Error('Database error');

        jest.spyOn(TeamRepository, 'InsertTeamToDatabase').mockRejectedValue(
            testError
        );

        jest.spyOn(IdHelper, 'generateIdWithPrefix').mockReturnValue(
            'TM123456'
        );

        await expect(
            addTeamToDatabase('Peterborough Warriors')
        ).rejects.toThrow(testError);
    });
});
