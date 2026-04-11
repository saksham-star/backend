const { sequelize, Incident, IncidentTimeline, Notification, User, Ambulance, Hospital, EmergencyContact } = require('../models');
const { Op } = require('sequelize');
const { findNearestAmbulance, findNearestHospital, getDistanceKm } = require('../services/geoService');
const { estimateEtaMinutes } = require('../services/mapsService');
const { notifyNewEmergency, notifyIncidentUpdate } = require('../services/socketService');
const { sendEmergencySms } = require('../services/smsService');

const VALID_STATUSES = [
    'pending', 'assigned', 'enroute_pickup', 'reached_pickup',
    'patient_picked', 'enroute_hospital', 'reached_hospital', 'completed', 'cancelled',
];

const STATUS_TIMESTAMPS = {
    patient_picked: 'picked_up_at',
    reached_hospital: 'reached_hospital_at',
    completed: 'completed_at',
    cancelled: 'cancelled_at',
};

const USER_ATTRIBUTES = ['id', 'name', 'phone', 'email', 'age', 'blood_group', 'allergies', 'medical_conditions', 'emergency_contact_name', 'emergency_contact_phone'];
const AMBULANCE_ATTRIBUTES = { exclude: ['driver_password'] };

// POST /api/incidents/sos
const triggerSOS = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { user_id, latitude, longitude, address, incident_type, severity, trigger_type, description } = req.body;

        if (!latitude || !longitude) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'latitude and longitude are required' });
        }

        if (isNaN(latitude) || isNaN(longitude)) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'Invalid latitude or longitude' });
        }

        if (req.user.id !== parseInt(user_id)) {
            await t.rollback();
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const user = await User.findByPk(user_id, { attributes: USER_ATTRIBUTES });
        if (!user) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const incident = await Incident.create({
            user_id,
            latitude,
            longitude,
            address: address || null,
            incident_type: incident_type || 'medical',
            severity: severity || 'high',
            trigger_type: trigger_type || 'manual',
            description: description || null,
            status: 'pending',
        }, { transaction: t });

        const [nearestAmbulance, nearestHospital] = await Promise.all([
            findNearestAmbulance(latitude, longitude),
            findNearestHospital(latitude, longitude),
        ]);

        // If no ambulance or hospital available, still commit incident as pending — never fail SOS creation
        if (!nearestAmbulance || !nearestHospital) {
            const pendingMsg = !nearestAmbulance
                ? 'No ambulance available nearby. Awaiting dispatch.'
                : 'No hospital with available beds found. Awaiting assignment.';
            await IncidentTimeline.create({
                incident_id: incident.id,
                status: 'pending',
                message: pendingMsg,
                created_by: 'system',
            }, { transaction: t });
            await t.commit();

            notifyNewEmergency({ incidentId: incident.id, incident, user, ambulanceId: null, hospitalId: null, userId: user_id });

            EmergencyContact.findAll({ where: { user_id }, limit: 2 }).then(async (contacts) => {
                if (!contacts.length) return;
                const smsMsg = `${user.name} ka accident hua hai. Please call karo. Dispatch pending.`;
                const phones = contacts.map((c) => String(c.phone).replace(/\D/g, '').slice(-10)).filter((p) => p.length === 10).join(',');
                if (!phones) return;
                await sendEmergencySms(phones, smsMsg).catch(() => {});
            }).catch(() => {});

            return res.status(201).json({
                success: true,
                message: 'Emergency alert sent. Help will be dispatched shortly.',
                data: {
                    incident: { id: incident.id, status: 'pending', estimated_eta_minutes: null },
                    ambulance: null,
                    hospital: null,
                },
            });
        }

        const etaMinutes = estimateEtaMinutes(nearestAmbulance.distance_km);

        await incident.update({
            ambulance_id: nearestAmbulance.id,
            hospital_id: nearestHospital.id,
            status: 'assigned',
            estimated_eta_minutes: etaMinutes,
            assigned_at: new Date(),
        }, { transaction: t });

        await sequelize.query(
            `UPDATE ambulances SET status = 'busy' WHERE id = ?`,
            { replacements: [nearestAmbulance.id], transaction: t }
        );

        await IncidentTimeline.create({
            incident_id: incident.id,
            status: 'assigned',
            message: `Ambulance ${nearestAmbulance.vehicle_number} assigned. ETA: ${etaMinutes} min`,
            created_by: 'system',
        }, { transaction: t });

        await t.commit();

        // Post-commit side effects
        const payload = { incidentId: incident.id, incident, user, ambulance: nearestAmbulance, hospital: nearestHospital };
        notifyNewEmergency({ ...payload, ambulanceId: nearestAmbulance.id, hospitalId: nearestHospital.id, userId: user_id });

        // Send SMS to up to 2 emergency contacts (non-blocking — SOS flow must not crash)
        EmergencyContact.findAll({ where: { user_id }, limit: 2 }).then(async (contacts) => {
            if (!contacts.length) return;
            const hospitalName = nearestHospital?.name || 'Nearest hospital';
            const smsMsg = `${user.name} ka accident hua hai. Please call karo. Hospital: ${hospitalName}`;
            // Batch both contacts in a single API call
            const phones = contacts
                .map((c) => String(c.phone).replace(/\D/g, '').slice(-10))
                .filter((p) => p.length === 10)
                .join(',');
            if (!phones) return;
            const smsResult = await sendEmergencySms(phones, smsMsg).catch(() => ({ success: false, error: 'send error' }));
            contacts.forEach((contact) => {
                Notification.create({
                    incident_id: incident.id,
                    type: 'sms',
                    recipient_type: 'family',
                    recipient_name: contact.name,
                    recipient_contact: contact.phone,
                    message: smsMsg,
                    status: smsResult.success ? 'sent' : 'failed',
                    error_message: smsResult.error || null,
                }).catch(() => {});
            });
        }).catch(() => {});

        return res.status(201).json({
            success: true,
            message: 'Emergency alert sent successfully',
            data: {
                incident: { id: incident.id, status: incident.status, estimated_eta_minutes: etaMinutes },
                ambulance: {
                    id: nearestAmbulance.id,
                    vehicle_number: nearestAmbulance.vehicle_number,
                    driver_name: nearestAmbulance.driver_name,
                    driver_phone: nearestAmbulance.driver_phone,
                    distance_km: parseFloat(nearestAmbulance.distance_km).toFixed(2),
                    eta_minutes: etaMinutes,
                },
                hospital: {
                    id: nearestHospital.id,
                    name: nearestHospital.name,
                    phone: nearestHospital.phone,
                    available_beds: nearestHospital.available_beds,
                    distance_km: parseFloat(nearestHospital.distance_km).toFixed(2),
                },
            },
        });
    } catch (error) {
        await t.rollback();
        console.error('triggerSOS:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// GET /api/incidents/active
const getActiveIncidents = async (req, res) => {
    try {
        const activeStatuses = ['pending', 'assigned', 'enroute_pickup', 'reached_pickup', 'patient_picked', 'enroute_hospital', 'reached_hospital'];
        const incidents = await Incident.findAll({
            where: { status: { [Op.in]: activeStatuses } },
            include: [
                { model: User, as: 'user', attributes: USER_ATTRIBUTES },
                { model: Ambulance, as: 'ambulance', attributes: AMBULANCE_ATTRIBUTES },
                { model: Hospital, as: 'hospital' },
            ],
            order: [['created_at', 'DESC']],
        });

        return res.status(200).json({ success: true, message: 'Active incidents fetched', data: incidents });
    } catch (error) {
        console.error('getActiveIncidents:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// GET /api/incidents/:id
const getIncidentById = async (req, res) => {
    try {
        const incident = await Incident.findByPk(req.params.id, {
            include: [
                { model: User, as: 'user', attributes: USER_ATTRIBUTES },
                { model: Ambulance, as: 'ambulance', attributes: AMBULANCE_ATTRIBUTES },
                { model: Hospital, as: 'hospital' },
                { model: IncidentTimeline, as: 'timeline', order: [['created_at', 'ASC']] },
            ],
        });

        if (!incident) {
            return res.status(404).json({ success: false, message: 'Incident not found' });
        }

        return res.status(200).json({ success: true, message: 'Incident fetched', data: incident });
    } catch (error) {
        console.error('getIncidentById:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// PUT /api/incidents/:id/status
const updateIncidentStatus = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { status, message } = req.body;

        if (!status) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'status is required' });
        }

        if (!VALID_STATUSES.includes(status)) {
            await t.rollback();
            return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${VALID_STATUSES.join(', ')}` });
        }

        const incident = await Incident.findByPk(req.params.id, { transaction: t });
        if (!incident) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Incident not found' });
        }

        const updates = { status };
        const tsField = STATUS_TIMESTAMPS[status];
        if (tsField) updates[tsField] = new Date();

        if (status === 'completed' && incident.created_at) {
            updates.total_duration_seconds = Math.floor((Date.now() - new Date(incident.created_at).getTime()) / 1000);
        }

        await incident.update(updates, { transaction: t });

        await IncidentTimeline.create({
            incident_id: incident.id,
            status,
            message: message || `Status updated to ${status}`,
            created_by: req.user.role === 'ambulance_driver' ? 'driver' : 'system',
        }, { transaction: t });

        if (status === 'completed' && incident.ambulance_id) {
            await sequelize.query(
                `UPDATE ambulances SET status = 'available', total_trips = total_trips + 1 WHERE id = ?`,
                { replacements: [incident.ambulance_id], transaction: t }
            );
        }

        await t.commit();

        notifyIncidentUpdate({
            incidentId: incident.id,
            status,
            userId: incident.user_id,
            hospitalId: incident.hospital_id,
            ambulanceId: incident.ambulance_id,
        });

        return res.status(200).json({ success: true, message: 'Incident status updated', data: { id: incident.id, status } });
    } catch (error) {
        await t.rollback();
        console.error('updateIncidentStatus:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// POST /api/incidents/:id/cancel
const cancelIncident = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const incident = await Incident.findByPk(req.params.id, { transaction: t });
        if (!incident) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Incident not found' });
        }

        if (['completed', 'cancelled'].includes(incident.status)) {
            await t.rollback();
            return res.status(400).json({ success: false, message: `Cannot cancel a ${incident.status} incident` });
        }

        const { cancellation_reason } = req.body;

        await incident.update({
            status: 'cancelled',
            cancelled_at: new Date(),
            cancellation_reason: cancellation_reason || null,
        }, { transaction: t });

        await IncidentTimeline.create({
            incident_id: incident.id,
            status: 'cancelled',
            message: cancellation_reason || 'Incident cancelled by user',
            created_by: 'user',
        }, { transaction: t });

        if (incident.ambulance_id) {
            await sequelize.query(
                `UPDATE ambulances SET status = 'available' WHERE id = ?`,
                { replacements: [incident.ambulance_id], transaction: t }
            );
        }

        await t.commit();

        notifyIncidentUpdate({
            incidentId: incident.id,
            status: 'cancelled',
            userId: incident.user_id,
            hospitalId: incident.hospital_id,
            ambulanceId: incident.ambulance_id,
        });

        return res.status(200).json({ success: true, message: 'Incident cancelled', data: { id: incident.id, status: 'cancelled' } });
    } catch (error) {
        await t.rollback();
        console.error('cancelIncident:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// GET /api/incidents
const listIncidents = async (req, res) => {
    try {
        const { status, incident_type, user_id, date_from, date_to, page = 1, limit = 10 } = req.query;
        const where = {};

        if (status) where.status = status;
        if (incident_type) where.incident_type = incident_type;

        // Ownership: normal users can only see their own incidents
        if (req.user.role === 'user') {
            where.user_id = req.user.id;
        } else if (req.user.role === 'ambulance_driver') {
            where.ambulance_id = req.user.id;
        } else if (user_id) {
            where.user_id = user_id;
        }

        if (date_from || date_to) {
            where.created_at = {};
            if (date_from) where.created_at[Op.gte] = new Date(date_from);
            if (date_to) where.created_at[Op.lte] = new Date(date_to);
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await Incident.findAndCountAll({
            where,
            include: [
                { model: User, as: 'user', attributes: ['id', 'name', 'phone'] },
                { model: Ambulance, as: 'ambulance', attributes: ['id', 'vehicle_number', 'driver_name'] },
                { model: Hospital, as: 'hospital', attributes: ['id', 'name', 'city'] },
            ],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset,
        });

        return res.status(200).json({
            success: true,
            message: 'Incidents fetched',
            data: rows,
            pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / parseInt(limit)) },
        });
    } catch (error) {
        console.error('listIncidents:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { triggerSOS, getActiveIncidents, getIncidentById, updateIncidentStatus, cancelIncident, listIncidents };
