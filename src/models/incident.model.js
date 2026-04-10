const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Incident = sequelize.define(
        'Incident',
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            ambulance_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            hospital_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            latitude: {
                type: DataTypes.DECIMAL(10, 8),
                allowNull: false,
            },
            longitude: {
                type: DataTypes.DECIMAL(11, 8),
                allowNull: false,
            },
            address: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            incident_type: {
                type: DataTypes.ENUM('accident', 'medical', 'fire', 'crime', 'other'),
                defaultValue: 'medical',
            },
            severity: {
                type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
                defaultValue: 'high',
            },
            trigger_type: {
                type: DataTypes.ENUM('manual', 'auto_crash', 'voice'),
                defaultValue: 'manual',
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            status: {
                type: DataTypes.ENUM(
                    'pending',
                    'assigned',
                    'enroute_pickup',
                    'reached_pickup',
                    'patient_picked',
                    'enroute_hospital',
                    'reached_hospital',
                    'completed',
                    'cancelled'
                ),
                defaultValue: 'pending',
            },
            response_time_seconds: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            total_duration_seconds: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            estimated_eta_minutes: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            assigned_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            picked_up_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            reached_hospital_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            completed_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            cancelled_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            cancellation_reason: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
        },
        {
            tableName: 'incidents',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: false,
        }
    );

    return Incident;
};