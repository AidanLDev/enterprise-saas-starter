import { handleDocsJson, handleDocsHtml } from '../../../src/handlers/docs';
import { openApiSpec } from '../../../src/openapi';
import { asStructuredResult } from '../test-utils';

describe('handleDocsJson', () => {
  it('returns the OpenAPI spec as JSON', async () => {
    const res = asStructuredResult(await handleDocsJson());
    const body = JSON.parse(res.body as string);

    expect(res.statusCode).toBe(200);
    expect(res.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(body).toEqual(openApiSpec);
  });
});

describe('handleDocsHtml', () => {
  it('returns an HTML page embedding the Swagger UI', async () => {
    const res = asStructuredResult(await handleDocsHtml());

    expect(res.statusCode).toBe(200);
    expect(res.headers).toMatchObject({ 'Content-Type': 'text/html' });
    expect(res.body).toContain('<div id="swagger-ui"></div>');
    expect(res.body).toContain("url: '/docs/openapi.json'");
  });
});
