const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const AmbulanceLocation = sequelize.define(
        'AmbulanceLocation',
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            ambulance_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            incident_id: {
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
            speed: {
                type: DataTypes.DECIMAL(5, 2),
                allowNull: true,
            },
            heading: {
                type: DataTypes.DECIMAL(5, 2),
                allowNull: true,
            },
            recorded_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            tableName: 'ambulance_locations',
            timestamps: false,
        }
    );

    return AmbulanceLocation;
};