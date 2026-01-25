import swaggerJsdoc, { OAS3Definition } from 'swagger-jsdoc';
import { disciplinePaths, disciplineSchemas } from './discipline.spec';
import { segmentPaths, segmentSchemas } from './segment.spec';
import { coursePaths, courseSchemas } from './course.spec';
import { studentPaths, studentSchemas } from './student.spec';
import { teacherPaths, teacherSchemas } from './teacher.spec';
import { authPaths, authSchemas } from './auth.spec';
import { enrollmentPaths, enrollmentSchemas } from './enrollment.spec';
import { courseMaterialPaths, courseMaterialSchemas } from './course-material.spec';
import { apiKeyPaths, apiKeySchemas } from './api-key.spec';
import { chatPaths, chatSchemas } from './chat.spec';

const baseDefinition: OAS3Definition = {
  openapi: '3.0.3',
  info: {
    title: 'Aluminify API',
    version: '1.0.0',
    description: 'API documentation for Aluminify services',
  },
  servers: [
    {
      url: 'http://localhost:3000',
    },
  ],
  components: {
    schemas: {},
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token from authentication',
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API Key for direct API access (alternative to JWT)',
      },
    },
  },
  paths: {},
};

export function getOpenApiSpec() {
  const spec = swaggerJsdoc({
    definition: baseDefinition,
    apis: [],
  }) as { paths?: Record<string, unknown>; components?: { schemas?: Record<string, unknown> } };

  spec.paths = {
    ...(spec.paths ?? {}),
    ...disciplinePaths,
    ...segmentPaths,
    ...coursePaths,
    ...studentPaths,
    ...teacherPaths,
    ...authPaths,
    ...enrollmentPaths,
    ...courseMaterialPaths,
    ...apiKeyPaths,
    ...chatPaths,
  };

  spec.components = {
    ...(spec.components ?? { schemas: {} }),
    schemas: {
      ...(spec.components?.schemas ?? {}),
      ...disciplineSchemas,
      ...segmentSchemas,
      ...courseSchemas,
      ...studentSchemas,
      ...teacherSchemas,
      ...authSchemas,
      ...enrollmentSchemas,
      ...courseMaterialSchemas,
      ...apiKeySchemas,
      ...chatSchemas,
    },
  };

  return spec;
}


