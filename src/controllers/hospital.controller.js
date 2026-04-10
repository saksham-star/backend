const { Hospital } = require('../models');
const { Op, literal, fn, col } = require('sequelize');

const listHospitals = async (req, res) => {
    try {
        const { city, specialty } = req.query;
        const where = { is_active: true };

        if (city) where.city = { [Op.like]: `%${city}%` };
        if (specialty) where.specialties = { [Op.like]: `%${specialty}%` };

        const hospitals = await Hospital.findAll({ where, order: [['name', 'ASC']] });

        return res.status(200).json({ success: true, message: 'Hospitals fetched', data: hospitals });
    } catch (error) {
        console.error('listHospitals:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getHospitalById = async (req, res) => {
    try {
        const hospital = await Hospital.findOne({
            where: { id: req.params.id, is_active: true },
        });

        if (!hospital) {
            return res.status(404).json({ success: false, message: 'Hospital not found' });
        }

        return res.status(200).json({ success: true, message: 'Hospital fetched', data: hospital });
    } catch (error) {
        console.error('getHospitalById:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getNearestHospitals = async (req, res) => {
    try {
        const { lat, lng } = req.query;

        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({ success: false, message: 'Valid lat and lng are required' });
        }

        const hospitals = await Hospital.findAll({
            where: { is_active: true, available_beds: { [Op.gt]: 0 } },
            attributes: {
                include: [
                    [
                        literal(`(
                            6371 * acos(
                                cos(radians(${parseFloat(lat)})) * cos(radians(latitude)) *
                                cos(radians(longitude) - radians(${parseFloat(lng)})) +
                                sin(radians(${parseFloat(lat)})) * sin(radians(latitude))
                            )
                        )`),
                        'distance_km',
                    ],
                ],
            },
            order: literal('distance_km ASC'),
            limit: 10,
        });

        return res.status(200).json({ success: true, message: 'Nearest hospitals fetched', data: hospitals });
    } catch (error) {
        console.error('getNearestHospitals:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const updateBeds = async (req, res) => {
    try {
        const hospital = await Hospital.findOne({
            where: { id: req.params.id, is_active: true },
        });

        if (!hospital) {
            return res.status(404).json({ success: false, message: 'Hospital not found' });
        }

        const { available_beds, available_icu } = req.body;

        if (available_beds !== undefined) {
            if (available_beds < 0) {
                return res.status(400).json({ success: false, message: 'available_beds cannot be negative' });
            }
            if (available_beds > hospital.total_beds) {
                return res.status(400).json({
                    success: false,
                    message: `available_beds cannot exceed total_beds (${hospital.total_beds})`,
                });
            }
        }

        if (available_icu !== undefined) {
            if (available_icu < 0) {
                return res.status(400).json({ success: false, message: 'available_icu cannot be negative' });
            }
            if (available_icu > hospital.icu_beds) {
                return res.status(400).json({
                    success: false,
                    message: `available_icu cannot exceed icu_beds (${hospital.icu_beds})`,
                });
            }
        }

        const updates = {};
        if (available_beds !== undefined) updates.available_beds = available_beds;
        if (available_icu !== undefined) updates.available_icu = available_icu;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields to update' });
        }

        await hospital.update(updates);

        return res.status(200).json({
            success: true,
            message: 'Bed availability updated',
            data: { id: hospital.id, available_beds: hospital.available_beds, available_icu: hospital.available_icu },
        });
    } catch (error) {
        console.error('updateBeds:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { listHospitals, getHospitalById, getNearestHospitals, updateBeds };
