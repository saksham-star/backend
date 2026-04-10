const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('../src/index');

const token = jwt.sign({ id: 1, role: 'hospital_admin' }, process.env.JWT_SECRET || 'test_secret');

const validLog = {
    type: 'sms',
    recipient_type: 'family',
    recipient_contact: '9876543210',
    message: 'Test alert',
};

describe('Notification Module', () => {
    describe('POST /api/notifications', () => {
        it('should return 401 without token', async () => {
            const res = await request(app).post('/api/notifications').send(validLog);
            expect(res.statusCode).toBe(401);
        });

        it('should create notification log', async () => {
            const res = await request(app)
                .post('/api/notifications')
                .set('Authorization', `Bearer ${token}`)
                .send(validLog);
            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('id');
        });

        it('should return 400 for missing required fields', async () => {
            const res = await request(app)
                .post('/api/notifications')
                .set('Authorization', `Bearer ${token}`)
                .send({ type: 'sms' });
            expect(res.statusCode).toBe(400);
        });

        it('should return 400 for invalid type', async () => {
            const res = await request(app)
                .post('/api/notifications')
                .set('Authorization', `Bearer ${token}`)
                .send({ ...validLog, type: 'carrier_pigeon' });
            expect(res.statusCode).toBe(400);
        });

        it('should return 400 for invalid recipient_type', async () => {
            const res = await request(app)
                .post('/api/notifications')
                .set('Authorization', `Bearer ${token}`)
                .send({ ...validLog, recipient_type: 'alien' });
            expect(res.statusCode).toBe(400);
        });
    });

    describe('GET /api/notifications', () => {
        it('should return 401 without token', async () => {
            const res = await request(app).get('/api/notifications');
            expect(res.statusCode).toBe(401);
        });

        it('should return paginated notifications', async () => {
            const res = await request(app)
                .get('/api/notifications?page=1&limit=5')
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body).toHaveProperty('pagination');
        });

        it('should filter by type', async () => {
            const res = await request(app)
                .get('/api/notifications?type=sms')
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
        });

        it('should filter by status', async () => {
            const res = await request(app)
                .get('/api/notifications?status=sent')
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
        });
    });

    describe('GET /api/notifications/:id', () => {
        it('should return notification or 404', async () => {
            const res = await request(app)
                .get('/api/notifications/1')
                .set('Authorization', `Bearer ${token}`);
            expect([200, 404]).toContain(res.statusCode);
        });

        it('should return 404 for non-existent id', async () => {
            const res = await request(app)
                .get('/api/notifications/999999')
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(404);
            expect(res.body.success).toBe(false);
        });
    });

    describe('PUT /api/notifications/:id/status', () => {
        it('should return 400 for invalid status', async () => {
            const res = await request(app)
                .put('/api/notifications/1/status')
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'bounced' });
            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should return 400 when status missing', async () => {
            const res = await request(app)
                .put('/api/notifications/1/status')
                .set('Authorization', `Bearer ${token}`)
                .send({});
            expect(res.statusCode).toBe(400);
        });

        it('should update status or return 404', async () => {
            const res = await request(app)
                .put('/api/notifications/1/status')
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'delivered' });
            expect([200, 404]).toContain(res.statusCode);
        });
    });

    describe('POST /api/notifications/send-sms', () => {
        it('should return 401 without token', async () => {
            const res = await request(app)
                .post('/api/notifications/send-sms')
                .send({ to: '9876543210', message: 'Test' });
            expect(res.statusCode).toBe(401);
        });

        it('should send sms and log notification', async () => {
            const res = await request(app)
                .post('/api/notifications/send-sms')
                .set('Authorization', `Bearer ${token}`)
                .send({ to: '9876543210', message: 'Emergency alert test', recipient_type: 'family' });
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.sms).toHaveProperty('messageId');
            expect(res.body.data.notification.status).toBe('sent');
        });

        it('should return 400 when to or message missing', async () => {
            const res = await request(app)
                .post('/api/notifications/send-sms')
                .set('Authorization', `Bearer ${token}`)
                .send({ to: '9876543210' });
            expect(res.statusCode).toBe(400);
        });
    });
});
