const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'Emergency Alert System - Code Red API',
    description: 'API for accident/SOS detection, emergency alerting, hospital & ambulance management',
    version: '1.0.0',
  },
  host: 'localhost:8000',
  basePath: '/',
  schemes: ['http'],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'Authorization',
      description: 'Enter: Bearer <token>',
    },
  },
  tags: [
    { name: 'Auth - User', description: 'User registration & login' },
    { name: 'Auth - Hospital Admin', description: 'Hospital admin registration & login' },
    { name: 'Auth - Ambulance Driver', description: 'Ambulance driver registration & login' },
  ],
};

const outputFile = './swagger-output.json';
const routes = [
  './routes/authRoutes.js',
  './routes/studentRoutes.js',
  './index.js',
];

swaggerAutogen(outputFile, routes, doc);
