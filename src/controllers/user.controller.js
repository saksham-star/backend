const { User, Incident, EmergencyContact } = require('../models');

const ALLOWED_UPDATE_FIELDS = [
    'name', 'email', 'age', 'gender', 'blood_group',
    'allergies', 'address', 'city', 'state',
];

const getUserById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (req.user.id !== id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const user = await User.findByPk(id, {
            attributes: { exclude: ['password'] },
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({ success: true, message: 'User fetched', data: user });
    } catch (error) {
        console.error('getUserById:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const updateUser = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (req.user.id !== id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const updates = {};
        ALLOWED_UPDATE_FIELDS.forEach((field) => {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        });

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields to update' });
        }

        await user.update(updates);

        const updated = await User.findByPk(id, { attributes: { exclude: ['password'] } });

        return res.status(200).json({ success: true, message: 'User updated', data: updated });
    } catch (error) {
        console.error('updateUser:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getUserIncidents = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (req.user.id !== id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const incidents = await Incident.findAll({
            where: { user_id: id },
            order: [['created_at', 'DESC']],
            attributes: [
                'id', 'status', 'incident_type', 'severity',
                'address', 'latitude', 'longitude', 'created_at',
            ],
        });

        return res.status(200).json({ success: true, message: 'Incidents fetched', data: incidents });
    } catch (error) {
        console.error('getUserIncidents:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// GET /api/users/:id/emergency-contacts
const getEmergencyContacts = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (req.user.id !== id) return res.status(403).json({ success: false, message: 'Access denied' });

        const contacts = await EmergencyContact.findAll({
            where: { user_id: id },
            attributes: ['id', 'name', 'phone', 'relationship', 'is_primary'],
            order: [['is_primary', 'DESC'], ['id', 'ASC']],
            limit: 2,
        });

        return res.status(200).json({ success: true, data: contacts });
    } catch (error) {
        console.error('getEmergencyContacts:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// PUT /api/users/:id/emergency-contacts
// Body: [{ name, phone, relationship, is_primary }]  — max 2 entries
const saveEmergencyContacts = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (req.user.id !== id) return res.status(403).json({ success: false, message: 'Access denied' });

        let contacts = req.body.contacts;
        if (!Array.isArray(contacts)) return res.status(400).json({ success: false, message: 'contacts must be an array' });

        // Max 2
        contacts = contacts.slice(0, 2).filter(c => c.name && c.phone);

        // Validate phones
        for (const c of contacts) {
            const digits = String(c.phone).replace(/\D/g, '');
            if (digits.length < 10) return res.status(400).json({ success: false, message: `Invalid phone: ${c.phone}` });
        }

        // Duplicate phone check
        const phones = contacts.map(c => String(c.phone).replace(/\D/g, ''));
        if (new Set(phones).size !== phones.length) {
            return res.status(400).json({ success: false, message: 'Duplicate phone numbers not allowed' });
        }

        // Replace all existing contacts for user
        await EmergencyContact.destroy({ where: { user_id: id } });

        const created = await EmergencyContact.bulkCreate(
            contacts.map((c, i) => ({
                user_id: id,
                name: c.name,
                phone: String(c.phone).replace(/\D/g, ''),
                relationship: c.relationship || 'other',
                is_primary: i === 0,
            }))
        );

        return res.status(200).json({ success: true, message: 'Emergency contacts saved', data: created });
    } catch (error) {
        console.error('saveEmergencyContacts:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { getUserById, updateUser, getUserIncidents, getEmergencyContacts, saveEmergencyContacts };
