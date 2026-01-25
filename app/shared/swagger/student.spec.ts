export const studentSchemas = {
  Student: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      fullName: { type: 'string', nullable: true, example: 'João Silva' },
      email: { type: 'string', format: 'email', example: 'joao.silva@example.com' },
      cpf: { type: 'string', nullable: true, example: '12345678901' },
      phone: { type: 'string', nullable: true, example: '11987654321' },
      birthDate: { type: 'string', format: 'date', nullable: true, example: '2000-01-01' },
      address: { type: 'string', nullable: true, example: 'Rua das Flores, 123' },
      zipCode: { type: 'string', nullable: true, example: '12345678' },
      enrollmentNumber: { type: 'string', nullable: true, example: 'MAT2025001' },
      instagram: { type: 'string', nullable: true, example: '@joaosilva' },
      twitter: { type: 'string', nullable: true, example: '@joaosilva' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'email', 'createdAt', 'updatedAt'],
  },
  CreateStudentInput: {
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
        example: 'João Silva',
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
      birthDate: {
        type: 'string',
        format: 'date',
        example: '2000-01-01',
      },
      address: {
        type: 'string',
        example: 'Rua das Flores, 123',
      },
      zipCode: {
        type: 'string',
        pattern: '^\\d{8}$',
        description: 'ZIP code with 8 digits (numbers only)',
        example: '12345678',
      },
      enrollmentNumber: {
        type: 'string',
        maxLength: 50,
        example: 'MAT2025001',
      },
      instagram: {
        type: 'string',
        maxLength: 100,
        example: '@joaosilva',
      },
      twitter: {
        type: 'string',
        maxLength: 100,
        example: '@joaosilva',
      },
    },
    required: ['email'],
  },
  UpdateStudentInput: {
    type: 'object',
    properties: {
      fullName: {
        type: 'string',
        minLength: 3,
        maxLength: 200,
        nullable: true,
      },
      email: {
        type: 'string',
        format: 'email',
      },
      cpf: {
        type: 'string',
        pattern: '^\\d{11}$',
        nullable: true,
        description: 'CPF with 11 digits (numbers only)',
      },
      phone: {
        type: 'string',
        nullable: true,
        description: 'Phone number (10-15 digits, numbers only)',
      },
      birthDate: {
        type: 'string',
        format: 'date',
        nullable: true,
      },
      address: {
        type: 'string',
        nullable: true,
      },
      zipCode: {
        type: 'string',
        pattern: '^\\d{8}$',
        nullable: true,
        description: 'ZIP code with 8 digits (numbers only)',
      },
      enrollmentNumber: {
        type: 'string',
        maxLength: 50,
        nullable: true,
      },
      instagram: {
        type: 'string',
        maxLength: 100,
        nullable: true,
      },
      twitter: {
        type: 'string',
        maxLength: 100,
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

export const studentPaths = {
  '/api/student': {
    get: {
      tags: ['Student'],
      summary: 'List students',
      responses: {
        200: {
          description: 'Students fetched successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Student' },
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['Student'],
      summary: 'Create a student',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateStudentInput' },
          },
        },
      },
      responses: {
        201: {
          description: 'Student created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: '#/components/schemas/Student' },
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
          description: 'Conflict error (duplicate email, CPF, or enrollment number)',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },
  '/api/student/{id}': {
    parameters: [
      {
        in: 'path',
        name: 'id',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    get: {
      tags: ['Student'],
      summary: 'Get a student by id',
      responses: {
        200: {
          description: 'Student found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: '#/components/schemas/Student' },
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
      tags: ['Student'],
      summary: 'Update a student',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateStudentInput' },
          },
        },
      },
      responses: {
        200: {
          description: 'Student updated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: '#/components/schemas/Student' },
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
          description: 'Conflict error (duplicate email, CPF, or enrollment number)',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
    delete: {
      tags: ['Student'],
      summary: 'Delete a student',
      responses: {
        200: {
          description: 'Student deleted',
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

