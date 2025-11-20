export const apiKeySchemas = {
  ApiKey: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string', example: 'Production API Key' },
      createdBy: { type: 'string', format: 'uuid' },
      lastUsedAt: { type: 'string', format: 'date-time', nullable: true },
      expiresAt: { type: 'string', format: 'date-time', nullable: true },
      active: { type: 'boolean', example: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'name', 'createdBy', 'active', 'createdAt', 'updatedAt'],
  },
  CreateApiKeyInput: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 3,
        maxLength: 100,
        example: 'Production API Key',
      },
      expiresAt: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: '2026-12-31T23:59:59Z',
      },
    },
    required: ['name'],
  },
  UpdateApiKeyInput: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 3,
        maxLength: 100,
      },
      active: {
        type: 'boolean',
      },
      expiresAt: {
        type: 'string',
        format: 'date-time',
        nullable: true,
      },
    },
  },
  ApiKeyWithPlainKey: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      key: { type: 'string', example: 'sk_live_...', description: 'Plain API key (only shown once)' },
      createdBy: { type: 'string', format: 'uuid' },
      lastUsedAt: { type: 'string', format: 'date-time', nullable: true },
      expiresAt: { type: 'string', format: 'date-time', nullable: true },
      active: { type: 'boolean' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  ErrorResponse: {
    type: 'object',
    properties: {
      error: { type: 'string' },
    },
    required: ['error'],
  },
};

export const apiKeyPaths = {
  '/api/api-key': {
    get: {
      tags: ['API Key'],
      summary: 'List API keys',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'API keys fetched successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/ApiKey' },
                  },
                },
              },
            },
          },
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        403: {
          description: 'Forbidden (only teachers can create API keys)',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
    post: {
      tags: ['API Key'],
      summary: 'Create an API key',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateApiKeyInput' },
          },
        },
      },
      responses: {
        201: {
          description: 'API key created (plain key shown only once)',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: '#/components/schemas/ApiKeyWithPlainKey' },
                },
              },
            },
          },
        },
        400: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        403: {
          description: 'Forbidden (only teachers can create API keys)',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },
  '/api/api-key/{id}': {
    parameters: [
      {
        in: 'path',
        name: 'id',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    get: {
      tags: ['API Key'],
      summary: 'Get an API key by id',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'API key found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: '#/components/schemas/ApiKey' },
                },
              },
            },
          },
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        403: {
          description: 'Forbidden',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        404: {
          description: 'Not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
    put: {
      tags: ['API Key'],
      summary: 'Update an API key',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateApiKeyInput' },
          },
        },
      },
      responses: {
        200: {
          description: 'API key updated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: '#/components/schemas/ApiKey' },
                },
              },
            },
          },
        },
        400: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        403: {
          description: 'Forbidden',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        404: {
          description: 'Not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
    delete: {
      tags: ['API Key'],
      summary: 'Delete an API key',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'API key deleted',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                },
                required: ['success'],
              },
            },
          },
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        403: {
          description: 'Forbidden',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        404: {
          description: 'Not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },
};

