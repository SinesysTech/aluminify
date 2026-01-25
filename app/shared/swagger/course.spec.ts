export const courseSchemas = {
  Modality: {
    type: 'string',
    enum: ['EAD', 'LIVE'],
    example: 'EAD',
  },
  CourseType: {
    type: 'string',
    enum: ['Superextensivo', 'Extensivo', 'Intensivo', 'Superintensivo', 'Revisão'],
    example: 'Extensivo',
  },
  Course: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      segmentId: { type: 'string', format: 'uuid', nullable: true },
      disciplineId: { type: 'string', format: 'uuid', nullable: true },
      name: { type: 'string', example: 'Matemática Básica' },
      modality: { $ref: '#/components/schemas/Modality' },
      type: { $ref: '#/components/schemas/CourseType' },
      description: { type: 'string', nullable: true, example: 'Curso completo de matemática básica' },
      year: { type: 'integer', example: 2025 },
      startDate: { type: 'string', format: 'date', nullable: true, example: '2025-01-01' },
      endDate: { type: 'string', format: 'date', nullable: true, example: '2025-12-31' },
      accessMonths: { type: 'integer', nullable: true, example: 12 },
      planningUrl: { type: 'string', nullable: true, example: 'https://example.com/planning.pdf' },
      coverImageUrl: { type: 'string', nullable: true, example: 'https://example.com/cover.jpg' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'name', 'modality', 'type', 'year', 'createdAt', 'updatedAt'],
  },
  CreateCourseInput: {
    type: 'object',
    properties: {
      segmentId: { type: 'string', format: 'uuid', description: 'Optional segment ID' },
      disciplineId: { type: 'string', format: 'uuid', description: 'Optional discipline ID' },
      name: {
        type: 'string',
        minLength: 3,
        maxLength: 200,
        example: 'Matemática Básica',
      },
      modality: { $ref: '#/components/schemas/Modality' },
      type: { $ref: '#/components/schemas/CourseType' },
      description: {
        type: 'string',
        maxLength: 2000,
        example: 'Curso completo de matemática básica',
      },
      year: {
        type: 'integer',
        minimum: 2000,
        maximum: 2100,
        example: 2025,
      },
      startDate: { type: 'string', format: 'date', example: '2025-01-01' },
      endDate: { type: 'string', format: 'date', example: '2025-12-31' },
      accessMonths: {
        type: 'integer',
        minimum: 1,
        maximum: 120,
        example: 12,
      },
      planningUrl: { type: 'string', format: 'uri', example: 'https://example.com/planning.pdf' },
      coverImageUrl: { type: 'string', format: 'uri', example: 'https://example.com/cover.jpg' },
    },
    required: ['name', 'modality', 'type', 'year'],
  },
  UpdateCourseInput: {
    type: 'object',
    properties: {
      segmentId: { type: 'string', format: 'uuid', nullable: true },
      disciplineId: { type: 'string', format: 'uuid', nullable: true },
      name: {
        type: 'string',
        minLength: 3,
        maxLength: 200,
      },
      modality: { $ref: '#/components/schemas/Modality' },
      type: { $ref: '#/components/schemas/CourseType' },
      description: {
        type: 'string',
        maxLength: 2000,
        nullable: true,
      },
      year: {
        type: 'integer',
        minimum: 2000,
        maximum: 2100,
      },
      startDate: { type: 'string', format: 'date', nullable: true },
      endDate: { type: 'string', format: 'date', nullable: true },
      accessMonths: {
        type: 'integer',
        minimum: 1,
        maximum: 120,
        nullable: true,
      },
      planningUrl: { type: 'string', format: 'uri', nullable: true },
      coverImageUrl: { type: 'string', format: 'uri', nullable: true },
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

export const coursePaths = {
  '/api/course': {
    get: {
      tags: ['Course'],
      summary: 'List courses',
      responses: {
        200: {
          description: 'Courses fetched successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Course' },
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['Course'],
      summary: 'Create a course',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateCourseInput' },
          },
        },
      },
      responses: {
        201: {
          description: 'Course created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: '#/components/schemas/Course' },
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
          description: 'Conflict error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },
  '/api/course/{id}': {
    parameters: [
      {
        in: 'path',
        name: 'id',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    get: {
      tags: ['Course'],
      summary: 'Get a course by id',
      responses: {
        200: {
          description: 'Course found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: '#/components/schemas/Course' },
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
      tags: ['Course'],
      summary: 'Update a course',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateCourseInput' },
          },
        },
      },
      responses: {
        200: {
          description: 'Course updated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: '#/components/schemas/Course' },
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
      tags: ['Course'],
      summary: 'Delete a course',
      responses: {
        200: {
          description: 'Course deleted',
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

