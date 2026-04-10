const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Ambulance = sequelize.define(
        'Ambulance',
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            hospital_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            vehicle_number: {
                type: DataTypes.STRING(20),
                allowNull: false,
                unique: true,
            },
            driver_name: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            driver_phone: {
                type: DataTypes.STRING(15),
                allowNull: false,
            },
            driver_password: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            ambulance_type: {
                type: DataTypes.ENUM('basic', 'advanced', 'icu'),
                defaultValue: 'basic',
            },
            current_lat: {
                type: DataTypes.DECIMAL(10, 8),
                allowNull: true,
            },
            current_lng: {
                type: DataTypes.DECIMAL(11, 8),
                allowNull: true,
            },
            status: {
                type: DataTypes.ENUM('available', 'busy', 'offline', 'maintenance'),
                defaultValue: 'offline',
            },
            last_location_update: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            total_trips: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
        },
        {
            tableName: 'ambulances',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    );

    return Ambulance;
};