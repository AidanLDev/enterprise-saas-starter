import { jsonResponse } from '../router';
import { logger } from '../logger';

export async function handleHealth() {
  logger.debug('Health check');
  return jsonResponse(200, { status: 'ok', timestamp: new Date().toISOString() });
}
