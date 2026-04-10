const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const IncidentTimeline = sequelize.define(
        'IncidentTimeline',
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            incident_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            status: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            message: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            latitude: {
                type: DataTypes.DECIMAL(10, 8),
                allowNull: true,
            },
            longitude: {
                type: DataTypes.DECIMAL(11, 8),
                allowNull: true,
            },
            created_by: {
                type: DataTypes.ENUM('system', 'user', 'driver', 'hospital'),
                defaultValue: 'system',
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            tableName: 'incident_timeline',
            timestamps: false,
        }
    );

    return IncidentTimeline;
};