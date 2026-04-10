const { sequelize } = require('../config/dbConnection');

const User = require('./user.model')(sequelize);
const Hospital = require('./hospital.model')(sequelize);
const HospitalAdmin = require('./hospitalAdmin.model')(sequelize);
const Ambulance = require('./ambulance.model')(sequelize);
const AmbulanceLocation = require('./ambulanceLocation.model')(sequelize);
const EmergencyContact = require('./emergencyContact.model')(sequelize);
const Incident = require('./incident.model')(sequelize);
const IncidentTimeline = require('./incidentTimeline.model')(sequelize);
const Notification = require('./notification.model')(sequelize);

// Hospital associations
HospitalAdmin.belongsTo(Hospital, { foreignKey: 'hospital_id', as: 'hospital' });
Ambulance.belongsTo(Hospital, { foreignKey: 'hospital_id', as: 'hospital' });

// Incident associations
Incident.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Incident.belongsTo(Ambulance, { foreignKey: 'ambulance_id', as: 'ambulance' });
Incident.belongsTo(Hospital, { foreignKey: 'hospital_id', as: 'hospital' });
Incident.hasMany(IncidentTimeline, { foreignKey: 'incident_id', as: 'timeline' });

User.hasMany(Incident, { foreignKey: 'user_id', as: 'incidents' });
User.hasMany(EmergencyContact, { foreignKey: 'user_id', as: 'emergencyContacts' });
EmergencyContact.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
    sequelize,
    User,
    Hospital,
    HospitalAdmin,
    Ambulance,
    AmbulanceLocation,
    EmergencyContact,
    Incident,
    IncidentTimeline,
    Notification,
};
