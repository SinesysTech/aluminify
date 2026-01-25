export const teacherSchemas = {
  Teacher: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      fullName: { type: 'string', example: 'Prof. João Silva' },
      email: { type: 'string', format: 'email', example: 'joao.silva@example.com' },
      cpf: { type: 'string', nullable: true, example: '12345678901' },
      phone: { type: 'string', nullable: true, example: '11987654321' },
      biography: { type: 'string', nullable: true, example: 'Professor com 20 anos de experiência' },
      photoUrl: { type: 'string', nullable: true, example: 'https://example.com/photo.jpg' },
      specialty: { type: 'string', nullable: true, example: 'Doutor em História' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'fullName', 'email', 'createdAt', 'updatedAt'],
  },
  CreateTeacherInput: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'Optional ID (usually from auth.users)',
      },
      fullName: {
        type: 'string',
        minLength: 3,
        maxLength: 200,
        example: 'Prof. João Silva',
      },
      email: {
        type: 'string',
        format: 'email',
        example: 'joao.silva@example.com',
      },
      cpf: {
        type: 'string',
        pattern: '^\\d{11}$',
        description: 'CPF with 11 digits (numbers only)',
        example: '12345678901',
      },
      phone: {
        type: 'string',
        description: 'Phone number (10-15 digits, numbers only)',
        example: '11987654321',
      },
      biography: {
        type: 'string',
        maxLength: 2000,
        example: 'Professor com 20 anos de experiência',
      },
      photoUrl: {
        type: 'string',
        format: 'uri',
        example: 'https://example.com/photo.jpg',
      },
      specialty: {
        type: 'string',
        maxLength: 200,
        example: 'Doutor em História',
      },
    },
    required: ['fullName', 'email'],
  },
  UpdateTeacherInput: {
    type: 'object',
    properties: {
      fullName: {
        type: 'string',
        minLength: 3,
        maxLength: 200,
      },
      email: {
        type: 'string',
        format: 'email',
      },
      cpf: {
        type: 'string',
        pattern: '^\\d{11}$',
        nullable: true,
      },
      phone: {
        type: 'string',
        nullable: true,
      },
      biography: {
        type: 'string',
        maxLength: 2000,
        nullable: true,
      },
      photoUrl: {
        type: 'string',
        format: 'uri',
        nullable: true,
      },
      specialty: {
        type: 'string',
        maxLength: 200,
        nullable: true,
      },
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

export const teacherPaths = {
  '/api/teacher': {
    get: {
      tags: ['Teacher'],
      summary: 'List teachers',
      responses: {
        200: {
          description: 'Teachers fetched successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Teacher' },
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['Teacher'],
      summary: 'Create a teacher',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateTeacherInput' },
          },
        },
      },
      responses: {
        201: {
          description: 'Teacher created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: '#/components/schemas/Teacher' },
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
        409: {
          description: 'Conflict error (duplicate email or CPF)',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },
  '/api/teacher/{id}': {
    parameters: [
      {
        in: 'path',
        name: 'id',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    get: {
      tags: ['Teacher'],
      summary: 'Get a teacher by id',
      responses: {
        200: {
          description: 'Teacher found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: '#/components/schemas/Teacher' },
                },
              },
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
      tags: ['Teacher'],
      summary: 'Update a teacher',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateTeacherInput' },
          },
        },
      },
      responses: {
        200: {
          description: 'Teacher updated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: '#/components/schemas/Teacher' },
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
        404: {
          description: 'Not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        409: {
          description: 'Conflict error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
    delete: {
      tags: ['Teacher'],
      summary: 'Delete a teacher',
      responses: {
        200: {
          description: 'Teacher deleted',
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

