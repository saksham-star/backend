const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('../src/index');

const token = jwt.sign({ id: 1, role: 'hospital_admin' }, process.env.JWT_SECRET || 'test_secret');

describe('Analytics Module', () => {
    describe('GET /api/analytics/dashboard', () => {
        it('should return 401 without token', async () => {
            const res = await request(app).get('/api/analytics/dashboard');
            expect(res.statusCode).toBe(401);
        });

        it('should return dashboard stats', async () => {
            const res = await request(app)
                .get('/api/analytics/dashboard')
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('active_incidents_count');
            expect(res.body.data).toHaveProperty('available_ambulances_count');
            expect(res.body.data).toHaveProperty('total_beds');
            expect(res.body.data).toHaveProperty('available_beds');
            expect(res.body.data).toHaveProperty('avg_response_time_minutes');
            expect(res.body.data).toHaveProperty('completed_incidents_count');
        });
    });

    describe('GET /api/analytics/incidents-trend', () => {
        it('should return 401 without token', async () => {
            const res = await request(app).get('/api/analytics/incidents-trend');
            expect(res.statusCode).toBe(401);
        });

        it('should return trend for default 7 days', async () => {
            const res = await request(app)
                .get('/api/analytics/incidents-trend')
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('should return trend for custom days', async () => {
            const res = await request(app)
                .get('/api/analytics/incidents-trend?days=30')
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('should return 400 for invalid days', async () => {
            const res = await request(app)
                .get('/api/analytics/incidents-trend?days=abc')
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should return 400 for days out of range', async () => {
            const res = await request(app)
                .get('/api/analytics/incidents-trend?days=500')
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(400);
        });
    });

    describe('GET /api/analytics/response-time-by-hospital', () => {
        it('should return 401 without token', async () => {
            const res = await request(app).get('/api/analytics/response-time-by-hospital');
            expect(res.statusCode).toBe(401);
        });

        it('should return response time grouped by hospital', async () => {
            const res = await request(app)
                .get('/api/analytics/response-time-by-hospital')
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            if (res.body.data.length > 0) {
                expect(res.body.data[0]).toHaveProperty('hospital_id');
                expect(res.body.data[0]).toHaveProperty('hospital_name');
                expect(res.body.data[0]).toHaveProperty('avg_response_minutes');
            }
        });
    });

    describe('GET /api/analytics/incident-types', () => {
        it('should return 401 without token', async () => {
            const res = await request(app).get('/api/analytics/incident-types');
            expect(res.statusCode).toBe(401);
        });

        it('should return incident type distribution', async () => {
            const res = await request(app)
                .get('/api/analytics/incident-types')
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            if (res.body.data.length > 0) {
                expect(res.body.data[0]).toHaveProperty('incident_type');
                expect(res.body.data[0]).toHaveProperty('count');
                expect(res.body.data[0]).toHaveProperty('percentage');
            }
        });
    });

    describe('GET /api/analytics/ambulance-utilization', () => {
        it('should return 401 without token', async () => {
            const res = await request(app).get('/api/analytics/ambulance-utilization');
            expect(res.statusCode).toBe(401);
        });

        it('should return ambulance utilization by status', async () => {
            const res = await request(app)
                .get('/api/analytics/ambulance-utilization')
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            if (res.body.data.length > 0) {
                expect(res.body.data[0]).toHaveProperty('status');
                expect(res.body.data[0]).toHaveProperty('count');
                expect(res.body.data[0]).toHaveProperty('percentage');
            }
        });
    });

    describe('GET /api/analytics/hospital-beds', () => {
        it('should return 401 without token', async () => {
            const res = await request(app).get('/api/analytics/hospital-beds');
            expect(res.statusCode).toBe(401);
        });

        it('should return bed availability per hospital', async () => {
            const res = await request(app)
                .get('/api/analytics/hospital-beds')
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            if (res.body.data.length > 0) {
                expect(res.body.data[0]).toHaveProperty('hospital_id');
                expect(res.body.data[0]).toHaveProperty('hospital_name');
                expect(res.body.data[0]).toHaveProperty('total_beds');
                expect(res.body.data[0]).toHaveProperty('available_beds');
                expect(res.body.data[0]).toHaveProperty('bed_availability_percent');
            }
        });
    });
});
