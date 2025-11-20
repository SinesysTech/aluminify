import swaggerJsdoc, { OAS3Definition } from 'swagger-jsdoc';
import { disciplinePaths, disciplineSchemas } from './discipline.spec';

const baseDefinition: OAS3Definition = {
  openapi: '3.0.3',
  info: {
    title: 'Área do Aluno API',
    version: '1.0.0',
    description: 'API documentation for Área do Aluno services',
  },
  servers: [
    {
      url: 'http://localhost:3000',
    },
  ],
  components: {
    schemas: {},
  },
  paths: {},
};

export function getOpenApiSpec() {
  const spec = swaggerJsdoc({
    definition: baseDefinition,
    apis: [],
  });

  spec.paths = {
    ...(spec.paths ?? {}),
    ...disciplinePaths,
  };

  spec.components = {
    ...(spec.components ?? { schemas: {} }),
    schemas: {
      ...(spec.components?.schemas ?? {}),
      ...disciplineSchemas,
    },
  };

  return spec;
}


