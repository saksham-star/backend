const { createServer } = require('http');
const { Server } = require('socket.io');
const { io: ioClient } = require('socket.io-client');
const { registerSocketHandlers } = require('../src/socket/socketHandlers');

let httpServer, serverIo, clientSocket, port;

beforeAll((done) => {
    httpServer = createServer();
    serverIo = new Server(httpServer, { cors: { origin: '*' } });
    registerSocketHandlers(serverIo);
    httpServer.listen(() => {
        port = httpServer.address().port;
        clientSocket = ioClient(`http://localhost:${port}`);
        clientSocket.on('connect', done);
    });
});

afterAll((done) => {
    clientSocket.disconnect();
    serverIo.close();
    httpServer.close(done);
});

const waitFor = (socket, event) =>
    new Promise((resolve) => socket.once(event, resolve));

describe('Socket Module', () => {
    test('join-ambulance => joins room and emits joined', (done) => {
        clientSocket.emit('join-ambulance', { ambulanceId: 5 });
        clientSocket.once('joined', (data) => {
            expect(data.room).toBe('ambulance:5');
            done();
        });
    });

    test('join-ambulance with missing payload => socket-error', (done) => {
        clientSocket.emit('join-ambulance', {});
        clientSocket.once('socket-error', (err) => {
            expect(err.event).toBe('join-ambulance');
            expect(err.message).toBeTruthy();
            done();
        });
    });

    test('join-hospital => joins room and emits joined', (done) => {
        clientSocket.emit('join-hospital', { hospitalId: 3 });
        clientSocket.once('joined', (data) => {
            expect(data.room).toBe('hospital:3');
            done();
        });
    });

    test('join-hospital with missing payload => socket-error', (done) => {
        clientSocket.emit('join-hospital', {});
        clientSocket.once('socket-error', (err) => {
            expect(err.event).toBe('join-hospital');
            done();
        });
    });

    test('sos-trigger => broadcasts sos-broadcast to all', (done) => {
        clientSocket.emit('sos-trigger', {
            incidentId: 101,
            userId: 1,
            latitude: 22.8046,
            longitude: 86.2029,
            address: 'Jamshedpur',
            incident_type: 'accident',
            severity: 'high',
        });
        clientSocket.once('sos-broadcast', (data) => {
            expect(data.incidentId).toBe(101);
            expect(data).toHaveProperty('timestamp');
            done();
        });
    });

    test('sos-trigger with missing payload => socket-error', (done) => {
        clientSocket.emit('sos-trigger', { incidentId: 1 });
        clientSocket.once('socket-error', (err) => {
            expect(err.event).toBe('sos-trigger');
            done();
        });
    });

    test('ambulance-location => emits ambulance-moved', (done) => {
        clientSocket.emit('ambulance-location', {
            ambulanceId: 5,
            incidentId: 101,
            lat: 22.81,
            lng: 86.21,
            speed: 60,
        });
        clientSocket.once('ambulance-moved', (data) => {
            expect(data.ambulanceId).toBe(5);
            expect(data.lat).toBe(22.81);
            expect(data).toHaveProperty('timestamp');
            done();
        });
    });

    test('ambulance-location with missing lat/lng => socket-error', (done) => {
        clientSocket.emit('ambulance-location', { ambulanceId: 5 });
        clientSocket.once('socket-error', (err) => {
            expect(err.event).toBe('ambulance-location');
            done();
        });
    });

    test('incident-updated => emits incident-status-changed', (done) => {
        clientSocket.emit('join-hospital', { hospitalId: 10 });
        clientSocket.once('joined', () => {
            const secondClient = ioClient(`http://localhost:${port}`);
            secondClient.on('connect', () => {
                secondClient.emit('join-hospital', { hospitalId: 10 });
                secondClient.once('joined', () => {
                    clientSocket.emit('incident-updated', {
                        incidentId: 101,
                        status: 'enroute_pickup',
                        hospitalId: 10,
                        message: 'En route to pickup',
                    });
                    secondClient.once('incident-status-changed', (data) => {
                        expect(data.incidentId).toBe(101);
                        expect(data.status).toBe('enroute_pickup');
                        secondClient.disconnect();
                        done();
                    });
                });
            });
        });
    });

    test('incident-updated with missing status => socket-error', (done) => {
        clientSocket.emit('incident-updated', { incidentId: 101 });
        clientSocket.once('socket-error', (err) => {
            expect(err.event).toBe('incident-updated');
            done();
        });
    });
});
