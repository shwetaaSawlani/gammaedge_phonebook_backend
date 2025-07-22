import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Phonebook API',
      version: '1.0.0',
      description: 'API docs for Phonebook App',
    },
    servers: [
      {
        url: 'http://localhost:8000', 
      },
    ],
  },
  apis: [
    './src/routes/*.ts',   
'./src/routes/*.js' 
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
