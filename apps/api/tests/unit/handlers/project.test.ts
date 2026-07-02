import { DeleteCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import {
  handleCreateProject,
  handleUpdateProject,
  handleDeleteProject,
  handleListProjects,
} from '../../../src/handlers/project';
import { NotFoundError } from '../../../src/errors';
import { makeEvent, asStructuredResult, ddbMock, resetMocks } from '../test-utils';

beforeEach(resetMocks);

// ─── handleCreateProject ──────────────────────────────────────────────────────

describe('handleCreateProject', () => {
  it('returns 403 for non-admin', async () => {
    const event = makeEvent({ role: 'user', method: 'POST', body: { projectName: 'Test' } });
    const res = asStructuredResult(await handleCreateProject(event));
    expect(res.statusCode).toBe(403);
  });

  it('returns 400 when projectName is missing', async () => {
    const event = makeEvent({ role: 'admin', method: 'POST', body: {} });
    const res = asStructuredResult(await handleCreateProject(event));
    expect(res.statusCode).toBe(400);
  });

  it('creates project and returns 201', async () => {
    ddbMock.on(PutCommand).resolves({});

    const event = makeEvent({
      role: 'admin',
      userId: 'admin-user-id',
      method: 'POST',
      body: { projectName: 'Test Project', projectDescription: 'A description' },
    });
    const res = asStructuredResult(await handleCreateProject(event));
    const body = JSON.parse(res.body as string);

    expect(res.statusCode).toBe(201);
    expect(body.data.name).toBe('Test Project');
    expect(body.data.description).toBe('A description');
    expect(body.data.createdBy).toBe('admin-user-id');
  });

  it('defaults description to empty string when omitted', async () => {
    ddbMock.on(PutCommand).resolves({});

    const event = makeEvent({
      role: 'admin',
      method: 'POST',
      body: { projectName: 'Test Project' },
    });
    const res = asStructuredResult(await handleCreateProject(event));
    const body = JSON.parse(res.body as string);

    expect(res.statusCode).toBe(201);
    expect(body.data.description).toBe('');
  });
});

// ─── handleUpdateProject ──────────────────────────────────────────────────────

describe('handleUpdateProject', () => {
  it('returns 403 for non-admin', async () => {
    const event = makeEvent({
      role: 'user',
      path: '/projects/project-id',
      method: 'PUT',
      body: { projectName: 'Updated' },
    });
    const res = asStructuredResult(await handleUpdateProject(event));
    expect(res.statusCode).toBe(403);
  });

  it('returns 400 when projectId is missing', async () => {
    const event = makeEvent({
      role: 'admin',
      path: '/projects/',
      method: 'PUT',
      body: { projectName: 'Updated' },
    });
    const res = asStructuredResult(await handleUpdateProject(event));
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when projectName is missing', async () => {
    const event = makeEvent({
      role: 'admin',
      path: '/projects/project-id',
      method: 'PUT',
      body: {},
    });
    const res = asStructuredResult(await handleUpdateProject(event));
    expect(res.statusCode).toBe(400);
  });

  it('throws NotFoundError when project does not exist', async () => {
    const conditionalError = new Error('The conditional request failed');
    conditionalError.name = 'ConditionalCheckFailedException';
    ddbMock.on(UpdateCommand).rejects(conditionalError);

    const event = makeEvent({
      role: 'admin',
      path: '/projects/missing-id',
      method: 'PUT',
      body: { projectName: 'Updated' },
    });

    await expect(handleUpdateProject(event)).rejects.toThrow(NotFoundError);
  });

  it('updates project and returns updated attributes', async () => {
    const updatedProject = { id: 'project-id', name: 'Updated', description: 'New desc' };
    ddbMock.on(UpdateCommand).resolves({ Attributes: updatedProject });

    const event = makeEvent({
      role: 'admin',
      path: '/projects/project-id',
      method: 'PUT',
      body: { projectName: 'Updated', projectDescription: 'New desc' },
    });
    const res = asStructuredResult(await handleUpdateProject(event));
    const body = JSON.parse(res.body as string);

    expect(res.statusCode).toBe(200);
    expect(body.data).toEqual(updatedProject);
  });
});

// ─── handleDeleteProject ──────────────────────────────────────────────────────

describe('handleDeleteProject', () => {
  it('returns 403 for non-admin', async () => {
    const event = makeEvent({ role: 'user', path: '/projects/project-id', method: 'DELETE' });
    const res = asStructuredResult(await handleDeleteProject(event));
    expect(res.statusCode).toBe(403);
  });

  it('returns 400 when projectId is missing', async () => {
    const event = makeEvent({ role: 'admin', path: '/projects/', method: 'DELETE' });
    const res = asStructuredResult(await handleDeleteProject(event));
    expect(res.statusCode).toBe(400);
  });

  it('deletes project and returns success', async () => {
    ddbMock.on(DeleteCommand).resolves({});

    const event = makeEvent({
      role: 'admin',
      path: '/projects/project-id',
      method: 'DELETE',
    });
    const res = asStructuredResult(await handleDeleteProject(event));
    const body = JSON.parse(res.body as string);

    expect(res.statusCode).toBe(200);
    expect(body.data).toEqual({ projectId: 'project-id', status: 'deleted' });
  });
});

// ─── handleListProjects ───────────────────────────────────────────────────────

describe('handleListProjects', () => {
  it('returns project list on success', async () => {
    const projects = [{ id: '1', name: 'Project One' }];
    ddbMock.on(QueryCommand).resolves({ Items: projects });

    const event = makeEvent({ role: 'user', path: '/projects' });
    const res = asStructuredResult(await handleListProjects(event));
    const body = JSON.parse(res.body as string);

    expect(res.statusCode).toBe(200);
    expect(body.data).toEqual(projects);
    expect(body.lastKey).toBeUndefined();
  });

  it('returns lastKey when DynamoDB paginates', async () => {
    ddbMock.on(QueryCommand).resolves({
      Items: [],
      LastEvaluatedKey: { PK: 'PROJECT#abc' },
    });

    const event = makeEvent({ role: 'user', path: '/projects' });
    const res = asStructuredResult(await handleListProjects(event));
    const body = JSON.parse(res.body as string);

    expect(res.statusCode).toBe(200);
    expect(body.lastKey).toBeDefined();
  });
});
