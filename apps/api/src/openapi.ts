export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Enterprise SaaS API',
    version: '1.0.0',
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health Check',
        tags: ['System'],
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/users/me': {
      get: {
        summary: 'Get current user',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'The authenticated user',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        role: { type: 'string', enum: ['admin', 'user'] },
                        createdAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'User not found' },
        },
      },
    },
    '/admin/users': {
      get: {
        summary: 'List all users',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'lastKey',
            in: 'query',
            required: false,
            description: 'Pagination cursor from the previous response',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Paginated list of users',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          email: { type: 'string', format: 'email' },
                          role: { type: 'string', enum: ['admin', 'user'] },
                          createdAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                    lastKey: {
                      type: 'string',
                      description: 'Pass this as lastKey to fetch the next page',
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden — admin role required' },
        },
      },
    },
    '/admin/users/{userId}/role': {
      put: {
        summary: 'Update a user role',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role'],
                properties: {
                  role: { type: 'string', enum: ['admin', 'user'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Role updated successfully' },
          '400': { description: 'Invalid role or attempting to change own role' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden — admin role required' },
          '404': { description: 'User not found' },
        },
      },
    },
    '/admin/invite': {
      post: {
        summary: 'Invite a new user',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  role: {
                    type: 'string',
                    enum: ['admin', 'user'],
                    default: 'user',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'User invited — Cognito sends a temporary password email',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        email: { type: 'string', format: 'email' },
                        role: { type: 'string', enum: ['admin', 'user'] },
                        status: { type: 'string', example: 'invited' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { description: 'Missing email or invalid role' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden — admin role required' },
        },
      },
    },
    '/admin/users/{userId}': {
      delete: {
        summary: 'Delete a user',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'User deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        userId: { type: 'string' },
                        status: { type: 'string', example: 'deleted' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { description: 'Attempting to delete own account' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden — admin role required' },
        },
      },
    },
    '/projects': {
      post: {
        summary: 'Create a project',
        tags: ['Projects'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['projectName'],
                properties: {
                  projectName: { type: 'string' },
                  projectDescription: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Project created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        createdBy: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { description: 'Missing projectName' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden — admin role required' },
        },
      },
    },
  },
} as const;
