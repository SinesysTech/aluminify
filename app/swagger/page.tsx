'use client';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function SwaggerPage() {
  return (
    <main className="min-h-screen bg-white p-4">
      <SwaggerUI url="/api/docs" docExpansion="none" defaultModelsExpandDepth={0} />
    </main>
  );
}


