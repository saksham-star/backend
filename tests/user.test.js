const request = require('supertest');
const jwt = require('jsonwebtoken');

const { app } = require('../src/index');

const mockUserId = 1;
const otherUserId = 99;

const validToken = jwt.sign(
    { id: mockUserId, role: 'user' },
    process.env.JWT_SECRET || 'test_secret'
);

const otherToken = jwt.sign(
    { id: otherUserId, role: 'user' },
    process.env.JWT_SECRET || 'test_secret'
);

describe('User Module', () => {
    describe('GET /api/users/:id', () => {
        it('should return user profile for own id', async () => {
            const res = await request(app)
                .get(`/api/users/${mockUserId}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect([200, 404]).toContain(res.statusCode);
            expect(res.body).toHaveProperty('success');
            if (res.statusCode === 200) {
                expect(res.body.data).not.toHaveProperty('password');
            }
        });

        it('should return 403 when accessing another user profile', async () => {
            const res = await request(app)
                .get(`/api/users/${mockUserId}`)
                .set('Authorization', `Bearer ${otherToken}`);

            expect(res.statusCode).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('should return 401 with no token', async () => {
            const res = await request(app).get(`/api/users/${mockUserId}`);
            expect(res.statusCode).toBe(401);
        });
    });

    describe('PUT /api/users/:id', () => {
        it('should update user profile', async () => {
            const res = await request(app)
                .put(`/api/users/${mockUserId}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ age: 26, city: 'Jamshedpur' });

            expect([200, 404]).toContain(res.statusCode);
            expect(res.body).toHaveProperty('success');
        });

        it('should return 403 when updating another user', async () => {
            const res = await request(app)
                .put(`/api/users/${mockUserId}`)
                .set('Authorization', `Bearer ${otherToken}`)
                .send({ age: 26 });

            expect(res.statusCode).toBe(403);
        });

        it('should return 400 with no valid fields', async () => {
            const res = await request(app)
                .put(`/api/users/${mockUserId}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ password: 'hack', id: 99 });

            expect([400, 404]).toContain(res.statusCode);
        });
    });

    describe('GET /api/users/:id/incidents', () => {
        it('should return incident history', async () => {
            const res = await request(app)
                .get(`/api/users/${mockUserId}/incidents`)
                .set('Authorization', `Bearer ${validToken}`);

            expect([200, 404]).toContain(res.statusCode);
            if (res.statusCode === 200) {
                expect(Array.isArray(res.body.data)).toBe(true);
            }
        });

        it('should return 403 for another user incidents', async () => {
            const res = await request(app)
                .get(`/api/users/${mockUserId}/incidents`)
                .set('Authorization', `Bearer ${otherToken}`);

            expect(res.statusCode).toBe(403);
        });
    });
});
