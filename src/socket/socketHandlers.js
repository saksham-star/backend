const registerSocketHandlers = (io) => {
    io.on('connection', (socket) => {
        console.log(`[Socket] Connected: ${socket.id}`);

        socket.on('join-ambulance', ({ ambulanceId } = {}) => {
            if (!ambulanceId) {
                return socket.emit('socket-error', { event: 'join-ambulance', message: 'ambulanceId is required' });
            }
            socket.join(`ambulance:${ambulanceId}`);
            socket.emit('joined', { room: `ambulance:${ambulanceId}` });
        });

        socket.on('join-hospital', ({ hospitalId } = {}) => {
            if (!hospitalId) {
                return socket.emit('socket-error', { event: 'join-hospital', message: 'hospitalId is required' });
            }
            socket.join(`hospital:${hospitalId}`);
            socket.emit('joined', { room: `hospital:${hospitalId}` });
        });

        socket.on('join-incident', ({ incidentId } = {}) => {
            if (!incidentId) {
                return socket.emit('socket-error', { event: 'join-incident', message: 'incidentId is required' });
            }
            socket.join(`incident:${incidentId}`);
            socket.emit('joined', { room: `incident:${incidentId}` });
        });

        socket.on('sos-trigger', (payload = {}) => {
            const { incidentId, userId, latitude, longitude } = payload;
            if (!incidentId || !userId || !latitude || !longitude) {
                return socket.emit('socket-error', { event: 'sos-trigger', message: 'incidentId, userId, latitude, longitude are required' });
            }
            io.emit('sos-broadcast', { ...payload, timestamp: new Date().toISOString() });
        });

        socket.on('ambulance-location', (payload = {}) => {
            const { ambulanceId, incidentId, lat, lng } = payload;
            if (!ambulanceId || !lat || !lng) {
                return socket.emit('socket-error', { event: 'ambulance-location', message: 'ambulanceId, lat, lng are required' });
            }
            const locationPayload = { ...payload, timestamp: new Date().toISOString() };
            if (incidentId) io.to(`incident:${incidentId}`).emit('ambulance-moved', locationPayload);
            io.to(`ambulance:${ambulanceId}`).emit('ambulance-moved', locationPayload);
            io.emit('ambulance-moved', locationPayload);
        });

        socket.on('incident-updated', (payload = {}) => {
            const { incidentId, status } = payload;
            if (!incidentId || !status) {
                return socket.emit('socket-error', { event: 'incident-updated', message: 'incidentId and status are required' });
            }
            const updatePayload = { ...payload, timestamp: new Date().toISOString() };
            io.to(`incident:${incidentId}`).emit('incident-status-changed', updatePayload);
            if (payload.ambulanceId) io.to(`ambulance:${payload.ambulanceId}`).emit('incident-status-changed', updatePayload);
            if (payload.hospitalId) io.to(`hospital:${payload.hospitalId}`).emit('incident-status-changed', updatePayload);
        });

        socket.on('disconnect', () => {
            console.log(`[Socket] Disconnected: ${socket.id}`);
        });

        socket.on('error', (err) => {
            console.error(`[Socket] Error on ${socket.id}:`, err);
        });
    });
};

module.exports = { registerSocketHandlers };
