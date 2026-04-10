const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('../src/index');

const driverToken = jwt.sign(
    { id: 1, role: 'ambulance_driver' },
    process.env.JWT_SECRET || 'test_secret'
);

describe('Ambulance Module', () => {
    describe('GET /api/ambulances', () => {
        it('should list active ambulances', async () => {
            const res = await request(app).get('/api/ambulances');
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('should filter by hospital_id', async () => {
            const res = await request(app).get('/api/ambulances?hospital_id=1');
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('should filter by status=available', async () => {
            const res = await request(app).get('/api/ambulances?status=available');
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('should return 400 for invalid status filter', async () => {
            const res = await request(app).get('/api/ambulances?status=flying');
            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/ambulances/:id', () => {
        it('should return ambulance by id', async () => {
            const res = await request(app).get('/api/ambulances/1');
            expect([200, 404]).toContain(res.statusCode);
            if (res.statusCode === 200) {
                expect(res.body.data).not.toHaveProperty('driver_password');
            }
        });

        it('should return 404 for non-existent ambulance', async () => {
            const res = await request(app).get('/api/ambulances/999999');
            expect(res.statusCode).toBe(404);
            expect(res.body.success).toBe(false);
        });
    });

    describe('PUT /api/ambulances/:id/status', () => {
        it('should return 401 without token', async () => {
            const res = await request(app)
                .put('/api/ambulances/1/status')
                .send({ status: 'available' });
            expect(res.statusCode).toBe(401);
        });

        it('should update status successfully', async () => {
            const res = await request(app)
                .put('/api/ambulances/1/status')
                .set('Authorization', `Bearer ${driverToken}`)
                .send({ status: 'available' });
            expect([200, 404]).toContain(res.statusCode);
            if (res.statusCode === 200) expect(res.body.success).toBe(true);
        });

        it('should return 400 for invalid status', async () => {
            const res = await request(app)
                .put('/api/ambulances/1/status')
                .set('Authorization', `Bearer ${driverToken}`)
                .send({ status: 'flying' });
            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should return 400 when status missing', async () => {
            const res = await request(app)
                .put('/api/ambulances/1/status')
                .set('Authorization', `Bearer ${driverToken}`)
                .send({});
            expect(res.statusCode).toBe(400);
        });

        it('should return 404 for non-existent ambulance', async () => {
            const res = await request(app)
                .put('/api/ambulances/999999/status')
                .set('Authorization', `Bearer ${driverToken}`)
                .send({ status: 'offline' });
            expect(res.statusCode).toBe(404);
        });
    });

    describe('PUT /api/ambulances/:id/location', () => {
        it('should update location successfully', async () => {
            const res = await request(app)
                .put('/api/ambulances/1/location')
                .set('Authorization', `Bearer ${driverToken}`)
                .send({ lat: 22.8046, lng: 86.2029 });
            expect([200, 404]).toContain(res.statusCode);
            if (res.statusCode === 200) {
                expect(res.body.data).toHaveProperty('current_lat');
                expect(res.body.data).toHaveProperty('current_lng');
            }
        });

        it('should return 400 for missing lat/lng', async () => {
            const res = await request(app)
                .put('/api/ambulances/1/location')
                .set('Authorization', `Bearer ${driverToken}`)
                .send({});
            expect(res.statusCode).toBe(400);
        });

        it('should return 400 for invalid lat/lng', async () => {
            const res = await request(app)
                .put('/api/ambulances/1/location')
                .set('Authorization', `Bearer ${driverToken}`)
                .send({ lat: 999, lng: 999 });
            expect(res.statusCode).toBe(400);
        });

        it('should return 401 without token', async () => {
            const res = await request(app)
                .put('/api/ambulances/1/location')
                .send({ lat: 22.8046, lng: 86.2029 });
            expect(res.statusCode).toBe(401);
        });
    });

    describe('GET /api/ambulances/nearest', () => {
        it('should return nearest available ambulances', async () => {
            const res = await request(app)
                .get('/api/ambulances/nearest?lat=22.8046&lng=86.2029');
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('should respect limit param', async () => {
            const res = await request(app)
                .get('/api/ambulances/nearest?lat=22.8046&lng=86.2029&limit=3');
            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBeLessThanOrEqual(3);
        });

        it('should return 400 if lat/lng missing', async () => {
            const res = await request(app).get('/api/ambulances/nearest');
            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should return 400 for non-numeric lat/lng', async () => {
            const res = await request(app).get('/api/ambulances/nearest?lat=abc&lng=xyz');
            expect(res.statusCode).toBe(400);
        });
    });
});
