const { getIo } = require('../config/socket');

const notifyNewEmergency = ({ incidentId, incident, user, ambulance, hospital, ambulanceId, hospitalId, userId }) => {
    const io = getIo();
    if (!io) return;
    const payload = { incidentId, incident, user, ambulance, hospital, ambulanceId, hospitalId, userId, timestamp: new Date().toISOString() };
    if (ambulanceId) io.to(`ambulance:${ambulanceId}`).emit('new-emergency', payload);
    if (hospitalId) io.to(`hospital:${hospitalId}`).emit('new-emergency', payload);
    io.emit('sos-broadcast', payload);
};

const notifyIncidentUpdate = ({ incidentId, status, userId, hospitalId, ambulanceId }) => {
    const io = getIo();
    if (!io) return;
    const payload = { incidentId, status, userId, hospitalId, ambulanceId, timestamp: new Date().toISOString() };
    if (incidentId) io.to(`incident:${incidentId}`).emit('incident-status-changed', payload);
    if (ambulanceId) io.to(`ambulance:${ambulanceId}`).emit('incident-status-changed', payload);
    if (hospitalId) io.to(`hospital:${hospitalId}`).emit('incident-status-changed', payload);
};

module.exports = { notifyNewEmergency, notifyIncidentUpdate };
