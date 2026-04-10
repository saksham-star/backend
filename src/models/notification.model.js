const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Notification = sequelize.define(
        'Notification',
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            incident_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            type: {
                type: DataTypes.ENUM('sms', 'call', 'email', 'push', 'socket'),
                allowNull: false,
            },
            recipient_type: {
                type: DataTypes.ENUM('user', 'family', 'driver', 'hospital', 'police'),
                allowNull: false,
            },
            recipient_name: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            recipient_contact: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            message: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            status: {
                type: DataTypes.ENUM('pending', 'sent', 'failed', 'delivered'),
                defaultValue: 'pending',
            },
            error_message: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            sent_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            tableName: 'notifications',
            timestamps: false,
        }
    );

    return Notification;
};