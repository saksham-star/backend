const { sequelize, Ambulance, Hospital } = require('../models');
const { Op, literal } = require('sequelize');

const getDistanceKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const haversineExpr = (lat, lng) =>
    literal(`(
        6371 * acos(
            cos(radians(${parseFloat(lat)})) * cos(radians(current_lat)) *
            cos(radians(current_lng) - radians(${parseFloat(lng)})) +
            sin(radians(${parseFloat(lat)})) * sin(radians(current_lat))
        )
    )`);

const hospitalHaversineExpr = (lat, lng) =>
    literal(`(
        6371 * acos(
            cos(radians(${parseFloat(lat)})) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(${parseFloat(lng)})) +
            sin(radians(${parseFloat(lat)})) * sin(radians(latitude))
        )
    )`);

const findNearestAmbulance = async (lat, lng) => {
    const [result] = await sequelize.query(
        `SELECT *, (
            6371 * acos(
                cos(radians(?)) * cos(radians(current_lat)) *
                cos(radians(current_lng) - radians(?)) +
                sin(radians(?)) * sin(radians(current_lat))
            )
        ) AS distance_km
        FROM ambulances
        WHERE is_active = TRUE AND status = 'available'
            AND current_lat IS NOT NULL AND current_lng IS NOT NULL
        ORDER BY distance_km ASC
        LIMIT 1`,
        { replacements: [parseFloat(lat), parseFloat(lng), parseFloat(lat)] }
    );
    return result[0] || null;
};

const findNearestHospital = async (lat, lng) => {
    const [result] = await sequelize.query(
        `SELECT *, (
            6371 * acos(
                cos(radians(?)) * cos(radians(latitude)) *
                cos(radians(longitude) - radians(?)) +
                sin(radians(?)) * sin(radians(latitude))
            )
        ) AS distance_km
        FROM hospitals
        WHERE is_active = TRUE AND available_beds > 0
        ORDER BY distance_km ASC
        LIMIT 1`,
        { replacements: [parseFloat(lat), parseFloat(lng), parseFloat(lat)] }
    );
    return result[0] || null;
};

module.exports = { getDistanceKm, findNearestAmbulance, findNearestHospital };
