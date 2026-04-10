const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Hospital = sequelize.define(
        'Hospital',
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING(150),
                allowNull: false,
            },
            email: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            phone: {
                type: DataTypes.STRING(15),
                allowNull: false,
            },
            address: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            city: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            state: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            pincode: {
                type: DataTypes.STRING(10),
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
            total_beds: {
                type: DataTypes.INTEGER,
                defaultValue: 50,
            },
            available_beds: {
                type: DataTypes.INTEGER,
                defaultValue: 50,
            },
            icu_beds: {
                type: DataTypes.INTEGER,
                defaultValue: 10,
            },
            available_icu: {
                type: DataTypes.INTEGER,
                defaultValue: 10,
            },
            specialties: {
                type: DataTypes.STRING(500),
                allowNull: true,
            },
            rating: {
                type: DataTypes.DECIMAL(2, 1),
                defaultValue: 4.0,
            },
            is_24x7: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
        },
        {
            tableName: 'hospitals',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    );

    return Hospital;
};