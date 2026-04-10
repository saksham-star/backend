const { User, Incident } = require('../models');

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

module.exports = { getUserById, updateUser, getUserIncidents };
