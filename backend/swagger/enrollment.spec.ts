export const enrollmentSchemas = {
  Enrollment: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      studentId: { type: 'string', format: 'uuid' },
      courseId: { type: 'string', format: 'uuid' },
      enrollmentDate: { type: 'string', format: 'date-time' },
      accessStartDate: { type: 'string', format: 'date', example: '2025-01-01' },
      accessEndDate: { type: 'string', format: 'date', example: '2025-12-31' },
      active: { type: 'boolean', example: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'studentId', 'courseId', 'enrollmentDate', 'accessStartDate', 'accessEndDate', 'active', 'createdAt', 'updatedAt'],
  },
  CreateEnrollmentInput: {
    type: 'object',
    properties: {
      studentId: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
      },
      courseId: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174001',
      },
      accessStartDate: {
        type: 'string',
        format: 'date',
        example: '2025-01-01',
      },
      accessEndDate: {
        type: 'string',
        format: 'date',
        example: '2025-12-31',
      },
      active: {
        type: 'boolean',
        example: true,
      },
    },
    required: ['studentId', 'courseId', 'accessEndDate'],
  },
  UpdateEnrollmentInput: {
    type: 'object',
    properties: {
      accessStartDate: {
        type: 'string',
        format: 'date',
      },
      accessEndDate: {
        type: 'string',
        format: 'date',
      },
      active: {
        type: 'boolean',
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

export const enrollmentPaths = {
  '/api/enrollment': {
    get: {
      tags: ['Enrollment'],
      summary: 'List enrollments',
      parameters: [
        {
          in: 'query',
          name: 'studentId',
          schema: { type: 'string', format: 'uuid' },
          description: 'Filter by student ID',
        },
        {
          in: 'query',
          name: 'courseId',
          schema: { type: 'string', format: 'uuid' },
          description: 'Filter by course ID',
        },
      ],
      responses: {
        200: {
          description: 'Enrollments fetched successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Enrollment' },
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['Enrollment'],
      summary: 'Create an enrollment',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateEnrollmentInput' },
          },
        },
      },
      responses: {
        201: {
          description: 'Enrollment created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: '#/components/schemas/Enrollment' },
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
          description: 'Conflict error (duplicate active enrollment)',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },
  '/api/enrollment/{id}': {
    parameters: [
      {
        in: 'path',
        name: 'id',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    get: {
      tags: ['Enrollment'],
      summary: 'Get an enrollment by id',
      responses: {
        200: {
          description: 'Enrollment found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: '#/components/schemas/Enrollment' },
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
      tags: ['Enrollment'],
      summary: 'Update an enrollment',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateEnrollmentInput' },
          },
        },
      },
      responses: {
        200: {
          description: 'Enrollment updated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: '#/components/schemas/Enrollment' },
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
      tags: ['Enrollment'],
      summary: 'Delete an enrollment',
      responses: {
        200: {
          description: 'Enrollment deleted',
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

