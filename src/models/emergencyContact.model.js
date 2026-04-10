const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const EmergencyContact = sequelize.define(
        'EmergencyContact',
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
            name: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            phone: {
                type: DataTypes.STRING(15),
                allowNull: false,
            },
            relationship: {
                type: DataTypes.ENUM(
                    'father',
                    'mother',
                    'spouse',
                    'sibling',
                    'child',
                    'friend',
                    'relative',
                    'other'
                ),
                defaultValue: 'other',
            },
            is_primary: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            tableName: 'emergency_contacts',
            timestamps: false,
        }
    );

    return EmergencyContact;
};