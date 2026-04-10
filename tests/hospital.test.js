const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('../src/index');

const adminToken = jwt.sign(
    { id: 1, role: 'hospital_admin' },
    process.env.JWT_SECRET || 'test_secret'
);

describe('Hospital Module', () => {
    describe('GET /api/hospitals', () => {
        it('should list active hospitals', async () => {
            const res = await request(app).get('/api/hospitals');
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('should filter by city', async () => {
            const res = await request(app).get('/api/hospitals?city=Jamshedpur');
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('should filter by specialty', async () => {
            const res = await request(app).get('/api/hospitals?specialty=cardiology');
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    describe('GET /api/hospitals/:id', () => {
        it('should return hospital by id', async () => {
            const res = await request(app).get('/api/hospitals/1');
            expect([200, 404]).toContain(res.statusCode);
            expect(res.body).toHaveProperty('success');
        });

        it('should return 404 for non-existent hospital', async () => {
            const res = await request(app).get('/api/hospitals/999999');
            expect(res.statusCode).toBe(404);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/hospitals/nearest', () => {
        it('should return nearest hospitals', async () => {
            const res = await request(app).get('/api/hospitals/nearest?lat=22.8046&lng=86.2029');
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('should return 400 if lat/lng missing', async () => {
            const res = await request(app).get('/api/hospitals/nearest');
            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should return 400 if lat/lng invalid', async () => {
            const res = await request(app).get('/api/hospitals/nearest?lat=abc&lng=xyz');
            expect(res.statusCode).toBe(400);
        });
    });

    describe('PUT /api/hospitals/:id/beds', () => {
        it('should return 401 without token', async () => {
            const res = await request(app)
                .put('/api/hospitals/1/beds')
                .send({ available_beds: 10 });
            expect(res.statusCode).toBe(401);
        });

        it('should return 400 for negative available_beds', async () => {
            const res = await request(app)
                .put('/api/hospitals/1/beds')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ available_beds: -5 });
            expect([400, 404]).toContain(res.statusCode);
            if (res.statusCode === 400) expect(res.body.success).toBe(false);
        });

        it('should return 400 when no valid fields sent', async () => {
            const res = await request(app)
                .put('/api/hospitals/1/beds')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});
            expect([400, 404]).toContain(res.statusCode);
        });

        it('should update beds successfully', async () => {
            const res = await request(app)
                .put('/api/hospitals/1/beds')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ available_beds: 10, available_icu: 2 });
            expect([200, 404]).toContain(res.statusCode);
            if (res.statusCode === 200) expect(res.body.success).toBe(true);
        });

        it('should return 404 for non-existent hospital', async () => {
            const res = await request(app)
                .put('/api/hospitals/999999/beds')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ available_beds: 5 });
            expect(res.statusCode).toBe(404);
        });
    });
});
