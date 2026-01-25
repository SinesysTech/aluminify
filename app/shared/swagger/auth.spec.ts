export const authSchemas = {
  UserRole: {
    type: 'string',
    enum: ['aluno', 'professor'],
    example: 'aluno',
  },
  AuthUser: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      email: { type: 'string', format: 'email' },
      role: { $ref: '#/components/schemas/UserRole' },
    },
    required: ['id', 'email', 'role'],
  },
  SignUpInput: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'user@example.com',
      },
      password: {
        type: 'string',
        format: 'password',
        minLength: 6,
        example: 'password123',
      },
      fullName: {
        type: 'string',
        example: 'João Silva',
      },
      role: {
        $ref: '#/components/schemas/UserRole',
      },
    },
    required: ['email', 'password'],
  },
  SignInInput: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'user@example.com',
      },
      password: {
        type: 'string',
        format: 'password',
        example: 'password123',
      },
    },
    required: ['email', 'password'],
  },
  AuthResponse: {
    type: 'object',
    properties: {
      user: { $ref: '#/components/schemas/AuthUser' },
      session: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
        },
        required: ['accessToken', 'refreshToken'],
      },
    },
    required: ['user', 'session'],
  },
  ErrorResponse: {
    type: 'object',
    properties: {
      error: { type: 'string' },
    },
    required: ['error'],
  },
};

export const authPaths = {
  '/api/auth/signup': {
    post: {
      tags: ['Auth'],
      summary: 'Sign up a new user',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SignUpInput' },
          },
        },
      },
      responses: {
        201: {
          description: 'User created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: '#/components/schemas/AuthResponse' },
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
      },
    },
  },
  '/api/auth/signin': {
    post: {
      tags: ['Auth'],
      summary: 'Sign in a user',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SignInInput' },
          },
        },
      },
      responses: {
        200: {
          description: 'User signed in successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
          },
        },
        401: {
          description: 'Invalid credentials',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },
  '/api/auth/signout': {
    post: {
      tags: ['Auth'],
      summary: 'Sign out the current user',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'User signed out successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
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
      },
    },
  },
  '/api/auth/me': {
    get: {
      tags: ['Auth'],
      summary: 'Get current user',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Current user information',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: '#/components/schemas/AuthUser' },
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
      },
    },
  },
  '/api/auth/refresh': {
    post: {
      tags: ['Auth'],
      summary: 'Refresh access token',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                refreshToken: { type: 'string' },
              },
              required: ['refreshToken'],
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Token refreshed successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
          },
        },
        401: {
          description: 'Invalid refresh token',
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

