import { PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import {
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { inviteUser, updateUserRole } from '../../../src/services/user-service';
import { NotFoundError } from '../../../src/errors';
import { ddbMock, cognitoMock, resetMocks } from '../test-utils';

beforeEach(resetMocks);

// ─── inviteUser ───────────────────────────────────────────────────────────────

describe('inviteUser', () => {
  it('throws when Cognito does not return a sub attribute', async () => {
    cognitoMock.on(AdminCreateUserCommand).resolves({ User: { Attributes: [] } });

    await expect(inviteUser({ email: 'new@example.com', role: 'user' })).rejects.toThrow(
      /user ID from Cognito/i
    );
  });

  it('creates the Cognito user, writes the DynamoDB record, and assigns the group', async () => {
    cognitoMock.on(AdminCreateUserCommand).resolves({
      User: { Attributes: [{ Name: 'sub', Value: 'new-sub-id' }] },
    });
    ddbMock.on(PutCommand).resolves({});
    cognitoMock.on(AdminAddUserToGroupCommand).resolves({});

    const result = await inviteUser({ email: 'new@example.com', role: 'admin' });

    expect(result).toEqual({ email: 'new@example.com', role: 'admin', status: 'invited' });

    const createInput = cognitoMock.commandCalls(AdminCreateUserCommand)[0].args[0].input;
    expect(createInput.UserPoolId).toBe('us-east-1_test');
    expect(createInput.Username).toBe('new@example.com');
    expect(createInput.UserAttributes).toContainEqual({ Name: 'email_verified', Value: 'true' });

    const putInput = ddbMock.commandCalls(PutCommand)[0].args[0].input;
    expect(putInput.TableName).toBe('test-table');
    expect(putInput.Item).toMatchObject({
      PK: 'USER#new-sub-id',
      SK: 'USER#new-sub-id',
      GSI1PK: 'USERS',
      id: 'new-sub-id',
      email: 'new@example.com',
      role: 'admin',
      entityType: 'USER',
    });

    const groupInput = cognitoMock.commandCalls(AdminAddUserToGroupCommand)[0].args[0].input;
    expect(groupInput).toMatchObject({
      UserPoolId: 'us-east-1_test',
      Username: 'new-sub-id',
      GroupName: 'admin',
    });
  });
});

// ─── updateUserRole ───────────────────────────────────────────────────────────

describe('updateUserRole', () => {
  it('throws NotFoundError when DynamoDB returns no attributes', async () => {
    ddbMock.on(UpdateCommand).resolves({});

    await expect(updateUserRole({ userId: 'missing-id', newRole: 'admin' })).rejects.toThrow(
      NotFoundError
    );
  });

  it('promotes to admin: updates DynamoDB, removes the user group, adds the admin group', async () => {
    const updatedUser = { id: 'user-id', role: 'admin' };
    ddbMock.on(UpdateCommand).resolves({ Attributes: updatedUser });
    cognitoMock.on(AdminRemoveUserFromGroupCommand).resolves({});
    cognitoMock.on(AdminAddUserToGroupCommand).resolves({});

    const result = await updateUserRole({ userId: 'user-id', newRole: 'admin' });

    expect(result.user).toEqual(updatedUser);

    const updateInput = ddbMock.commandCalls(UpdateCommand)[0].args[0].input;
    expect(updateInput.Key).toEqual({ PK: 'USER#user-id', SK: 'USER#user-id' });
    expect(updateInput.ExpressionAttributeValues).toEqual({ ':role': 'admin' });

    const removeInput = cognitoMock.commandCalls(AdminRemoveUserFromGroupCommand)[0].args[0].input;
    expect(removeInput).toMatchObject({ Username: 'user-id', GroupName: 'user' });

    const addInput = cognitoMock.commandCalls(AdminAddUserToGroupCommand)[0].args[0].input;
    expect(addInput).toMatchObject({ Username: 'user-id', GroupName: 'admin' });
  });

  it('demotes to user: removes the admin group, adds the user group', async () => {
    ddbMock.on(UpdateCommand).resolves({ Attributes: { id: 'user-id', role: 'user' } });
    cognitoMock.on(AdminRemoveUserFromGroupCommand).resolves({});
    cognitoMock.on(AdminAddUserToGroupCommand).resolves({});

    await updateUserRole({ userId: 'user-id', newRole: 'user' });

    const removeInput = cognitoMock.commandCalls(AdminRemoveUserFromGroupCommand)[0].args[0].input;
    expect(removeInput).toMatchObject({ Username: 'user-id', GroupName: 'admin' });

    const addInput = cognitoMock.commandCalls(AdminAddUserToGroupCommand)[0].args[0].input;
    expect(addInput).toMatchObject({ Username: 'user-id', GroupName: 'user' });
  });
});
