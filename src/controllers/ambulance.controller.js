const { Ambulance, Hospital } = require('../models');
const { Op, literal } = require('sequelize');

const ALLOWED_STATUSES = ['available', 'busy', 'offline', 'maintenance'];

const SAFE_ATTRIBUTES = { exclude: ['driver_password'] };

const listAmbulances = async (req, res) => {
    try {
        const { hospital_id, status } = req.query;
        const where = { is_active: true };

        if (hospital_id) where.hospital_id = hospital_id;
        if (status) {
            if (!ALLOWED_STATUSES.includes(status)) {
                return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` });
            }
            where.status = status;
        }

        const ambulances = await Ambulance.findAll({
            where,
            attributes: SAFE_ATTRIBUTES,
            include: [{ model: Hospital, as: 'hospital', attributes: ['id', 'name', 'city'] }],
            order: [['driver_name', 'ASC']],
        });

        return res.status(200).json({ success: true, message: 'Ambulances fetched', data: ambulances });
    } catch (error) {
        console.error('listAmbulances:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getAmbulanceById = async (req, res) => {
    try {
        const ambulance = await Ambulance.findOne({
            where: { id: req.params.id, is_active: true },
            attributes: SAFE_ATTRIBUTES,
            include: [{ model: Hospital, as: 'hospital', attributes: ['id', 'name', 'phone', 'city', 'state'] }],
        });

        if (!ambulance) {
            return res.status(404).json({ success: false, message: 'Ambulance not found' });
        }

        return res.status(200).json({ success: true, message: 'Ambulance fetched', data: ambulance });
    } catch (error) {
        console.error('getAmbulanceById:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const updateStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, message: 'status is required' });
        }

        if (!ALLOWED_STATUSES.includes(status)) {
            return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` });
        }

        const ambulance = await Ambulance.findOne({ where: { id: req.params.id, is_active: true } });

        if (!ambulance) {
            return res.status(404).json({ success: false, message: 'Ambulance not found' });
        }

        await ambulance.update({ status });

        return res.status(200).json({
            success: true,
            message: 'Status updated',
            data: { id: ambulance.id, vehicle_number: ambulance.vehicle_number, status: ambulance.status },
        });
    } catch (error) {
        console.error('updateStatus:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const updateLocation = async (req, res) => {
    try {
        const { lat, lng } = req.body;

        if (lat === undefined || lng === undefined) {
            return res.status(400).json({ success: false, message: 'lat and lng are required' });
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);

        if (isNaN(latitude) || isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.status(400).json({ success: false, message: 'Invalid lat/lng values' });
        }

        const ambulance = await Ambulance.findOne({ where: { id: req.params.id, is_active: true } });

        if (!ambulance) {
            return res.status(404).json({ success: false, message: 'Ambulance not found' });
        }

        await ambulance.update({
            current_lat: latitude,
            current_lng: longitude,
            last_location_update: new Date(),
        });

        return res.status(200).json({
            success: true,
            message: 'Location updated',
            data: { id: ambulance.id, current_lat: latitude, current_lng: longitude, last_location_update: ambulance.last_location_update },
        });
    } catch (error) {
        console.error('updateLocation:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getNearestAmbulances = async (req, res) => {
    try {
        const { lat, lng, limit = 5 } = req.query;

        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({ success: false, message: 'Valid lat and lng are required' });
        }

        const parsedLat = parseFloat(lat);
        const parsedLng = parseFloat(lng);
        const parsedLimit = Math.min(parseInt(limit) || 5, 20);

        const ambulances = await Ambulance.findAll({
            where: {
                is_active: true,
                status: 'available',
                current_lat: { [Op.ne]: null },
                current_lng: { [Op.ne]: null },
            },
            attributes: {
                exclude: ['driver_password'],
                include: [
                    [
                        literal(`(
                            6371 * acos(
                                cos(radians(${parsedLat})) * cos(radians(current_lat)) *
                                cos(radians(current_lng) - radians(${parsedLng})) +
                                sin(radians(${parsedLat})) * sin(radians(current_lat))
                            )
                        )`),
                        'distance_km',
                    ],
                ],
            },
            include: [{ model: Hospital, as: 'hospital', attributes: ['id', 'name', 'city'] }],
            order: literal('distance_km ASC'),
            limit: parsedLimit,
        });

        return res.status(200).json({ success: true, message: 'Nearest ambulances fetched', data: ambulances });
    } catch (error) {
        console.error('getNearestAmbulances:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { listAmbulances, getAmbulanceById, updateStatus, updateLocation, getNearestAmbulances };
