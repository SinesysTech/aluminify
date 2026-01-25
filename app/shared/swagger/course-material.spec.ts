export const courseMaterialSchemas = {
  MaterialType: {
    type: 'string',
    enum: ['Apostila', 'Lista de Exercícios', 'Planejamento', 'Resumo', 'Gabarito', 'Outros'],
    example: 'Apostila',
  },
  CourseMaterial: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      courseId: { type: 'string', format: 'uuid' },
      title: { type: 'string', example: 'Apostila 1 - Introdução' },
      description: { type: 'string', nullable: true, example: 'Primeira apostila do curso' },
      type: { $ref: '#/components/schemas/MaterialType' },
      fileUrl: {
        type: 'string',
        format: 'uri',
        example: 'https://example.com/materials/apostila1.pdf',
      },
      order: { type: 'integer', example: 0 },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'courseId', 'title', 'type', 'fileUrl', 'order', 'createdAt', 'updatedAt'],
  },
  CreateCourseMaterialInput: {
    type: 'object',
    properties: {
      courseId: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174001',
      },
      title: {
        type: 'string',
        minLength: 3,
        maxLength: 200,
        example: 'Apostila 1 - Introdução',
      },
      description: {
        type: 'string',
        maxLength: 2000,
        example: 'Primeira apostila do curso',
      },
      type: {
        $ref: '#/components/schemas/MaterialType',
      },
      fileUrl: {
        type: 'string',
        format: 'uri',
        example: 'https://example.com/materials/apostila1.pdf',
      },
      order: {
        type: 'integer',
        minimum: 0,
        maximum: 10000,
        example: 0,
      },
    },
    required: ['courseId', 'title', 'fileUrl'],
  },
  UpdateCourseMaterialInput: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        minLength: 3,
        maxLength: 200,
      },
      description: {
        type: 'string',
        maxLength: 2000,
        nullable: true,
      },
      type: {
        $ref: '#/components/schemas/MaterialType',
      },
      fileUrl: {
        type: 'string',
        format: 'uri',
      },
      order: {
        type: 'integer',
        minimum: 0,
        maximum: 10000,
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

export const courseMaterialPaths = {
  '/api/course-material': {
    get: {
      tags: ['CourseMaterial'],
      summary: 'List course materials',
      parameters: [
        {
          in: 'query',
          name: 'courseId',
          schema: { type: 'string', format: 'uuid' },
          description: 'Filter by course ID',
        },
      ],
      responses: {
        200: {
          description: 'Course materials fetched successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/CourseMaterial' },
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['CourseMaterial'],
      summary: 'Create a course material',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateCourseMaterialInput' },
          },
        },
      },
      responses: {
        201: {
          description: 'Course material created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: '#/components/schemas/CourseMaterial' },
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
  '/api/course-material/{id}': {
    parameters: [
      {
        in: 'path',
        name: 'id',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    get: {
      tags: ['CourseMaterial'],
      summary: 'Get a course material by id',
      responses: {
        200: {
          description: 'Course material found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: '#/components/schemas/CourseMaterial' },
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
      tags: ['CourseMaterial'],
      summary: 'Update a course material',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateCourseMaterialInput' },
          },
        },
      },
      responses: {
        200: {
          description: 'Course material updated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: '#/components/schemas/CourseMaterial' },
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
      },
    },
    delete: {
      tags: ['CourseMaterial'],
      summary: 'Delete a course material',
      responses: {
        200: {
          description: 'Course material deleted',
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

