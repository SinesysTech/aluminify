export const segmentSchemas = {
  Segment: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string', example: 'Pré-vestibular' },
      slug: { type: 'string', nullable: true, example: 'pre-vestibular' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'name', 'createdAt', 'updatedAt'],
  },
  CreateSegmentInput: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 3,
        maxLength: 120,
        example: 'Pré-vestibular',
      },
      slug: {
        type: 'string',
        minLength: 2,
        maxLength: 100,
        example: 'pre-vestibular',
        description: 'Optional slug. Must contain only lowercase letters, numbers, hyphens and underscores',
      },
    },
    required: ['name'],
  },
  UpdateSegmentInput: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 3,
        maxLength: 120,
      },
      slug: {
        type: 'string',
        minLength: 2,
        maxLength: 100,
        nullable: true,
        description: 'Slug. Must contain only lowercase letters, numbers, hyphens and underscores. Set to null to remove slug.',
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

export const segmentPaths = {
  '/api/segment': {
    get: {
      tags: ['Segment'],
      summary: 'List segments',
      responses: {
        200: {
          description: 'Segments fetched successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Segment' },
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['Segment'],
      summary: 'Create a segment',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateSegmentInput' },
          },
        },
      },
      responses: {
        201: {
          description: 'Segment created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: '#/components/schemas/Segment' },
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
          description: 'Duplicate segment (name or slug)',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },
  '/api/segment/{id}': {
    parameters: [
      {
        in: 'path',
        name: 'id',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    get: {
      tags: ['Segment'],
      summary: 'Get a segment by id',
      responses: {
        200: {
          description: 'Segment found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: '#/components/schemas/Segment' },
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
      tags: ['Segment'],
      summary: 'Update a segment',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateSegmentInput' },
          },
        },
      },
      responses: {
        200: {
          description: 'Segment updated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: '#/components/schemas/Segment' },
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
          description: 'Conflicting name or slug',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
    delete: {
      tags: ['Segment'],
      summary: 'Delete a segment',
      responses: {
        200: {
          description: 'Segment deleted',
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

