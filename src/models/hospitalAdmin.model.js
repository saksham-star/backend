const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const HospitalAdmin = sequelize.define(
        'HospitalAdmin',
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
            name: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            email: {
                type: DataTypes.STRING(100),
                allowNull: false,
                unique: true,
            },
            password: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            phone: {
                type: DataTypes.STRING(15),
                allowNull: true,
            },
            role: {
                type: DataTypes.ENUM('admin', 'staff', 'doctor'),
                defaultValue: 'staff',
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            tableName: 'hospital_admins',
            timestamps: false,
        }
    );

    return HospitalAdmin;
};