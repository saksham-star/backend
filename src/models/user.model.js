const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const User = sequelize.define(
        'User',
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            phone: {
                type: DataTypes.STRING(15),
                allowNull: false,
                unique: true,
            },
            email: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            password: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            age: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            gender: {
                type: DataTypes.ENUM('male', 'female', 'other'),
                allowNull: true,
            },
            blood_group: {
                type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'),
                allowNull: true,
            },
            allergies: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            address: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            city: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            state: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
        },
        {
            tableName: 'users',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    );

    return User;
};