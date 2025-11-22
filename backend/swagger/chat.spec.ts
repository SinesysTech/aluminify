export const chatSchemas = {
  ChatIds: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: 'Session identifier for the chat conversation',
        example: 'test-session-12345',
      },
      userId: {
        type: 'string',
        description: 'User identifier',
        example: 'test-user-67890',
      },
    },
    required: ['sessionId', 'userId'],
  },
  ChatRequest: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        minLength: 1,
        maxLength: 5000,
        description: 'Message to send to the chat',
        example: 'Tobias, qual a melhor lei de newton?',
      },
      sessionId: {
        type: 'string',
        description: 'Session identifier for the chat conversation',
        example: 'test-session-12345',
      },
      userId: {
        type: 'string',
        description: 'User identifier (optional if authenticated, will use authenticated user ID)',
        example: 'test-user-67890',
      },
    },
    required: ['message', 'sessionId'],
  },
  ChatResponse: {
    type: 'object',
    properties: {
      output: {
        type: 'string',
        description: 'Response from the chat AI',
        example: 'A Primeira Lei de Newton, também conhecida como a Lei da Inércia...',
      },
    },
    required: ['output'],
  },
  ChatStreamChunk: {
    type: 'object',
    properties: {
      chunk: {
        type: 'string',
        description: 'Chunk of the streaming response',
      },
    },
    required: ['chunk'],
  },
  ErrorResponse: {
    type: 'object',
    properties: {
      error: { type: 'string' },
      details: {
        type: 'string',
        description: 'Additional error details (only in development)',
      },
    },
    required: ['error'],
  },
};

export const chatPaths = {
  '/api/chat': {
    post: {
      tags: ['Chat'],
      summary: 'Send a message to the chat AI',
      description: 'Sends a message to the chat AI and receives a response. Supports both regular JSON response and streaming via Server-Sent Events (SSE).',
      security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ChatRequest' },
            examples: {
              regular: {
                summary: 'Regular request',
                value: {
                  message: 'Tobias, qual a melhor lei de newton?',
                  sessionId: 'test-session-12345',
                  userId: 'test-user-67890',
                },
              },
            },
          },
        },
      },
      parameters: [
        {
          in: 'query',
          name: 'stream',
          required: false,
          schema: {
            type: 'boolean',
            default: false,
          },
          description: 'Enable streaming response (Server-Sent Events)',
        },
      ],
      responses: {
        200: {
          description: 'Chat response received successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: '#/components/schemas/ChatResponse' },
                },
                required: ['data'],
              },
              example: {
                data: {
                  output: 'A Primeira Lei de Newton, também conhecida como a Lei da Inércia...',
                },
              },
            },
            'text/event-stream': {
              schema: {
                type: 'string',
                description: 'Server-Sent Events stream with chat response chunks',
                example: 'data: {"chunk":"A Primeira Lei"}\n\ndata: {"chunk":" de Newton"}\n\ndata: [DONE]\n\n',
              },
            },
          },
        },
        400: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                missingMessage: {
                  summary: 'Missing message',
                  value: {
                    error: 'Campo obrigatório: message é necessário',
                  },
                },
                missingSessionId: {
                  summary: 'Missing session ID',
                  value: {
                    error: 'Session ID é necessário',
                  },
                },
                missingUserId: {
                  summary: 'Missing user ID',
                  value: {
                    error: 'User ID é necessário (fornecido no body ou via autenticação)',
                  },
                },
              },
            },
          },
        },
        401: {
          description: 'Unauthorized - Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        500: {
          description: 'Internal server error or chat service error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                webhookError: {
                  summary: 'Webhook error',
                  value: {
                    error: 'Failed to communicate with chat service: Error in workflow',
                  },
                },
                invalidResponse: {
                  summary: 'Invalid response format',
                  value: {
                    error: 'Invalid response format from webhook',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

