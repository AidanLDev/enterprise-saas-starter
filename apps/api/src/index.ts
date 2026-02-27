import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ApiResponse } from '@saas-starter/shared';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  const response: ApiResponse<string> = {
    data: 'API is running',
    statusCode: 200,
  };

  return {
    statusCode: 200,
    body: JSON.stringify(response),
  };
};
