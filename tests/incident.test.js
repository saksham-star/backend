const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('../src/index');

const SECRET = process.env.JWT_SECRET || 'test_secret';

const userToken = jwt.sign({ id: 1, role: 'user' }, SECRET);
const otherToken = jwt.sign({ id: 99, role: 'user' }, SECRET);
const driverToken = jwt.sign({ id: 1, role: 'ambulance_driver' }, SECRET);

const sosPayload = {
    user_id: 1,
    latitude: 22.8046,
    longitude: 86.2029,
    address: 'Bistupur, Jamshedpur',
    incident_type: 'accident',
    severity: 'high',
    trigger_type: 'manual',
};

describe('Incident Module', () => {
    describe('POST /api/incidents/sos', () => {
        it('should return 401 without token', async () => {
            const res = await request(app).post('/api/incidents/sos').send(sosPayload);
            expect(res.statusCode).toBe(401);
        });

        it('should return 403 when user_id mismatches token', async () => {
            const res = await request(app)
                .post('/api/incidents/sos')
                .set('Authorization', `Bearer ${otherToken}`)
                .send(sosPayload);
            expect(res.statusCode).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('should return 400 when lat/lng missing', async () => {
            const res = await request(app)
                .post('/api/incidents/sos')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ user_id: 1 });
            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should return 400 for invalid lat/lng', async () => {
            const res = await request(app)
                .post('/api/incidents/sos')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ ...sosPayload, latitude: 'abc', longitude: 'xyz' });
            expect(res.statusCode).toBe(400);
        });

        it('should trigger SOS or return 404/503', async () => {
            const res = await request(app)
                .post('/api/incidents/sos')
                .set('Authorization', `Bearer ${userToken}`)
                .send(sosPayload);
            expect([201, 404, 503]).toContain(res.statusCode);
            if (res.statusCode === 201) {
                expect(res.body.success).toBe(true);
                expect(res.body.data).toHaveProperty('incident');
                expect(res.body.data).toHaveProperty('ambulance');
                expect(res.body.data).toHaveProperty('hospital');
            }
        });
    });

    describe('GET /api/incidents/active', () => {
        it('should return 401 without token', async () => {
            const res = await request(app).get('/api/incidents/active');
            expect(res.statusCode).toBe(401);
        });

        it('should return active incidents', async () => {
            const res = await request(app)
                .get('/api/incidents/active')
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    describe('GET /api/incidents/:id', () => {
        it('should return 401 without token', async () => {
            const res = await request(app).get('/api/incidents/1');
            expect(res.statusCode).toBe(401);
        });

        it('should return incident or 404', async () => {
            const res = await request(app)
                .get('/api/incidents/1')
                .set('Authorization', `Bearer ${userToken}`);
            expect([200, 404]).toContain(res.statusCode);
            if (res.statusCode === 200) {
                expect(res.body.data).toHaveProperty('id');
                expect(res.body.data).toHaveProperty('timeline');
            }
        });

        it('should return 404 for non-existent incident', async () => {
            const res = await request(app)
                .get('/api/incidents/999999')
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.statusCode).toBe(404);
        });
    });

    describe('PUT /api/incidents/:id/status', () => {
        it('should return 400 for invalid status', async () => {
            const res = await request(app)
                .put('/api/incidents/1/status')
                .set('Authorization', `Bearer ${driverToken}`)
                .send({ status: 'flying' });
            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should return 400 when status missing', async () => {
            const res = await request(app)
                .put('/api/incidents/1/status')
                .set('Authorization', `Bearer ${driverToken}`)
                .send({});
            expect(res.statusCode).toBe(400);
        });

        it('should update status or return 404', async () => {
            const res = await request(app)
                .put('/api/incidents/1/status')
                .set('Authorization', `Bearer ${driverToken}`)
                .send({ status: 'enroute_pickup' });
            expect([200, 404]).toContain(res.statusCode);
        });
    });

    describe('POST /api/incidents/:id/cancel', () => {
        it('should return 401 without token', async () => {
            const res = await request(app).post('/api/incidents/1/cancel');
            expect(res.statusCode).toBe(401);
        });

        it('should cancel or return 404', async () => {
            const res = await request(app)
                .post('/api/incidents/999999/cancel')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ cancellation_reason: 'False alarm' });
            expect(res.statusCode).toBe(404);
        });
    });

    describe('GET /api/incidents', () => {
        it('should return 401 without token', async () => {
            const res = await request(app).get('/api/incidents');
            expect(res.statusCode).toBe(401);
        });

        it('should return paginated incidents', async () => {
            const res = await request(app)
                .get('/api/incidents?page=1&limit=5')
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body).toHaveProperty('pagination');
        });

        it('should filter by status', async () => {
            const res = await request(app)
                .get('/api/incidents?status=pending')
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.statusCode).toBe(200);
        });

        it('should filter by incident_type', async () => {
            const res = await request(app)
                .get('/api/incidents?incident_type=accident')
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.statusCode).toBe(200);
        });
    });
});
