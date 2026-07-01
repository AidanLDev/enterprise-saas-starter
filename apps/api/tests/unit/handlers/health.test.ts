import { handleHealth } from '../../../src/handlers/health';
import { asStructuredResult } from '../test-utils';

describe('handleHealth', () => {
  it('returns 200 with an ok status and timestamp', async () => {
    const res = asStructuredResult(await handleHealth());
    const body = JSON.parse(res.body as string);

    expect(res.statusCode).toBe(200);
    expect(body.status).toBe('ok');
    expect(new Date(body.timestamp).toString()).not.toBe('Invalid Date');
  });
});
