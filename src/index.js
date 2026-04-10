require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { initSocket } = require('./config/socket');
const { testConnection } = require('./config/dbConnection');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const ambulanceRoutes = require('./routes/ambulanceRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const smsRoutes = require('./routes/smsRoutes');

// PDF-spec controllers for alias routes
const { triggerSOS } = require('./controllers/incident.controller');
const { registerUser } = require('./controllers/auth.controller');
const { verifyToken } = require('./middlewares/auth.middleware');

let swaggerUi, swaggerDocument;
try {
    swaggerUi = require('swagger-ui-express');
    swaggerDocument = require('./swagger-output.json');
} catch (_) { }

const app = express();
const server = http.createServer(app);
const io = initSocket(server);


// app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], allowedHeaders: ['Content-Type', 'Authorization'] }));
const allowedOrigins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://d2fc-2401-4900-b511-479c-ec96-82fe-408d-66f6.ngrok-free.app",
    "https://ditdev.net"
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    // allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => res.json({ success: true, message: 'Emergency Alert System API is running' }));

// PDF-spec alias endpoints
app.post('/api/users', registerUser);
app.post('/api/sos', verifyToken, triggerSOS);

// Domain routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/ambulances', ambulanceRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/sms', smsRoutes);

if (swaggerUi && swaggerDocument) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

app.get('/db-test', async (req, res) => {
    try {
        await testConnection();
        res.json({ success: true, message: 'Database connection success' });
    } catch {
        res.status(500).json({ success: false, message: 'Database connection failed' });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, _req, res, _next) => {
    console.error('[Error]', err);
    res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

if (require.main === module) {
    const port = process.env.PORT || 8000;
    server.listen(port, async () => {
        console.log(`Server running at http://localhost:${port}`);
        await testConnection();
    });
}

module.exports = { app, server, io };
