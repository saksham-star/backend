const { sequelize } = require('../models');

const getDashboard = async (req, res) => {
    try {
        const [activeIncidents] = await sequelize.query(
            `SELECT COUNT(*) AS count FROM incidents
             WHERE status NOT IN ('completed','cancelled')`
        );

        const [ambulanceStats] = await sequelize.query(
            `SELECT status, COUNT(*) AS count FROM ambulances
             WHERE is_active = TRUE GROUP BY status`
        );

        const [hospitalStats] = await sequelize.query(
            `SELECT COUNT(*) AS total_hospitals, SUM(total_beds) AS total_beds,
                    SUM(available_beds) AS available_beds
             FROM hospitals WHERE is_active = TRUE`
        );

        const [avgResponse] = await sequelize.query(
            `SELECT AVG(response_time_seconds) AS avg_seconds
             FROM incidents WHERE response_time_seconds IS NOT NULL`
        );

        const [completed] = await sequelize.query(
            `SELECT COUNT(*) AS count FROM incidents WHERE status = 'completed'`
        );

        const ambulanceMap = { available: 0, busy: 0, offline: 0, maintenance: 0 };
        ambulanceStats.forEach(({ status, count }) => { ambulanceMap[status] = parseInt(count); });

        const avgSeconds = parseFloat(avgResponse[0].avg_seconds) || 0;

        return res.status(200).json({
            success: true,
            message: 'Dashboard data fetched',
            data: {
                active_incidents_count: parseInt(activeIncidents[0].count),
                available_ambulances_count: ambulanceMap.available,
                busy_ambulances_count: ambulanceMap.busy,
                offline_ambulances_count: ambulanceMap.offline + ambulanceMap.maintenance,
                total_hospitals_count: parseInt(hospitalStats[0].total_hospitals) || 0,
                total_beds: parseInt(hospitalStats[0].total_beds) || 0,
                available_beds: parseInt(hospitalStats[0].available_beds) || 0,
                avg_response_time_minutes: parseFloat((avgSeconds / 60).toFixed(2)),
                completed_incidents_count: parseInt(completed[0].count),
            },
        });
    } catch (error) {
        console.error('getDashboard:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getIncidentsTrend = async (req, res) => {
    try {
        let days = parseInt(req.query.days) || 7;
        if (isNaN(days) || days < 1 || days > 365) {
            return res.status(400).json({ success: false, message: 'days must be a number between 1 and 365' });
        }

        const [rows] = await sequelize.query(
            `SELECT DATE(created_at) AS date, COUNT(*) AS count
             FROM incidents
             WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             GROUP BY DATE(created_at)
             ORDER BY date ASC`,
            { replacements: [days] }
        );

        return res.status(200).json({ success: true, message: 'Incidents trend fetched', data: rows });
    } catch (error) {
        console.error('getIncidentsTrend:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getResponseTimeByHospital = async (req, res) => {
    try {
        const [rows] = await sequelize.query(
            `SELECT i.hospital_id, h.name AS hospital_name,
                    COUNT(i.id) AS total_incidents,
                    AVG(i.response_time_seconds) AS avg_response_seconds,
                    ROUND(AVG(i.response_time_seconds) / 60, 2) AS avg_response_minutes
             FROM incidents i
             JOIN hospitals h ON h.id = i.hospital_id
             WHERE i.response_time_seconds IS NOT NULL AND i.hospital_id IS NOT NULL
             GROUP BY i.hospital_id, h.name
             ORDER BY avg_response_seconds ASC`
        );

        return res.status(200).json({ success: true, message: 'Response time by hospital fetched', data: rows });
    } catch (error) {
        console.error('getResponseTimeByHospital:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getIncidentTypes = async (req, res) => {
    try {
        const [rows] = await sequelize.query(
            `SELECT incident_type, COUNT(*) AS count,
                    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS percentage
             FROM incidents
             GROUP BY incident_type
             ORDER BY count DESC`
        );

        return res.status(200).json({ success: true, message: 'Incident types fetched', data: rows });
    } catch (error) {
        console.error('getIncidentTypes:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getAmbulanceUtilization = async (req, res) => {
    try {
        const [rows] = await sequelize.query(
            `SELECT status, COUNT(*) AS count,
                    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS percentage
             FROM ambulances
             WHERE is_active = TRUE
             GROUP BY status
             ORDER BY count DESC`
        );

        return res.status(200).json({ success: true, message: 'Ambulance utilization fetched', data: rows });
    } catch (error) {
        console.error('getAmbulanceUtilization:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getHospitalBeds = async (req, res) => {
    try {
        const [rows] = await sequelize.query(
            `SELECT id AS hospital_id, name AS hospital_name,
                    total_beds, available_beds, icu_beds, available_icu,
                    ROUND((available_beds / total_beds) * 100, 1) AS bed_availability_percent
             FROM hospitals
             WHERE is_active = TRUE
             ORDER BY available_beds DESC`
        );

        return res.status(200).json({ success: true, message: 'Hospital beds fetched', data: rows });
    } catch (error) {
        console.error('getHospitalBeds:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { getDashboard, getIncidentsTrend, getResponseTimeByHospital, getIncidentTypes, getAmbulanceUtilization, getHospitalBeds };
