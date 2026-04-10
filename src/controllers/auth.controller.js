const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const {
    User,
    HospitalAdmin,
    Ambulance,
    Hospital,
} = require('../models');

/**
 * USER REGISTER
 */
const registerUser = async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            password,
            age,
            gender,
            blood_group,
            allergies,
            address,
            city,
            state,
        } = req.body;

        if (!name || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, phone and password are required',
            });
        }

        const existingUser = await User.findOne({ where: { phone } });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'User already exists with this phone number' });
        }

        if (email) {
            const existingEmail = await User.findOne({ where: { email } });
            if (existingEmail) {
                return res.status(409).json({ success: false, message: 'User already exists with this email' });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            phone,
            email,
            password: hashedPassword,
            age,
            gender,
            blood_group,
            allergies,
            address,
            city,
            state,
        });

        const token = generateToken({
            id: user.id,
            role: 'user',
        });

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            data: {
                id: user.id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                role: 'user',
            },
        });
    } catch (error) {
        console.error('registerUser error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to register user',
        });
    }
};

/**
 * USER LOGIN
 */
const loginUser = async (req, res) => {
    try {
        const { phone, password } = req.body;

        if (!phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'Phone and password are required',
            });
        }

        const user = await User.findOne({ where: { phone } });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!user.is_active) {
            return res.status(403).json({ success: false, message: 'User account is inactive' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password || '');
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = generateToken({
            id: user.id,
            role: 'user',
        });

        return res.status(200).json({
            success: true,
            message: 'User login successful',
            token,
            data: {
                id: user.id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                role: 'user',
            },
        });
    } catch (error) {
        console.error('loginUser error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to login user',
        });
    }
};

/**
 * HOSPITAL ADMIN REGISTER
 */
const registerHospitalAdmin = async (req, res) => {
    try {
        const {
            hospital_id,
            name,
            email,
            password,
            phone,
            role,
        } = req.body;

        if (!hospital_id || !name || !email || !password || !phone) {
            return res.status(400).json({
                success: false,
                message: 'hospital_id, name, email, phone and password are required',
            });
        }

        const hospital = await Hospital.findByPk(hospital_id);
        if (!hospital) {
            return res.status(404).json({
                success: false,
                message: 'Hospital not found',
            });
        }

        const existingAdmin = await HospitalAdmin.findOne({ where: { email } });

        if (existingAdmin) {
            return res.status(409).json({
                success: false,
                message: 'Hospital admin already exists with this email',
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await HospitalAdmin.create({
            hospital_id,
            name,
            email,
            password: hashedPassword,
            phone,
            role: role || 'staff',
        });

        const token = generateToken({
            id: admin.id,
            role: 'hospital_admin',
            hospital_id: admin.hospital_id,
        });

        return res.status(201).json({
            success: true,
            message: 'Hospital admin registered successfully',
            token,
            data: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                phone: admin.phone,
                hospital_id: admin.hospital_id,
                role: 'hospital_admin',
                admin_role: admin.role,
            },
        });
    } catch (error) {
        console.error('registerHospitalAdmin error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to register hospital admin',
        });
    }
};

/**
 * HOSPITAL ADMIN LOGIN
 */
const loginHospitalAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required',
            });
        }

        const admin = await HospitalAdmin.findOne({
            where: { email },
            include: [
                {
                    model: Hospital,
                    as: 'hospital',
                    attributes: ['id', 'name', 'phone', 'city', 'state'],
                },
            ],
        });

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Hospital admin not found',
            });
        }

        if (!admin.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Hospital admin account is inactive',
            });
        }

        const isPasswordValid = await bcrypt.compare(password, admin.password || '');

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        const token = generateToken({
            id: admin.id,
            role: 'hospital_admin',
            hospital_id: admin.hospital_id,
        });

        return res.status(200).json({
            success: true,
            message: 'Hospital admin login successful',
            token,
            data: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                phone: admin.phone,
                hospital_id: admin.hospital_id,
                role: 'hospital_admin',
                admin_role: admin.role,
                hospital: admin.hospital,
            },
        });
    } catch (error) {
        console.error('loginHospitalAdmin error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to login hospital admin',
        });
    }
};

/**
 * AMBULANCE DRIVER REGISTER
 * Note:
 * In your DB, ambulance itself stores driver details.
 * So this register creates a new ambulance record with driver_password.
 */
const registerAmbulanceDriver = async (req, res) => {
    try {
        const {
            hospital_id,
            vehicle_number,
            driver_name,
            driver_phone,
            password,
            ambulance_type,
        } = req.body;

        if (!hospital_id || !vehicle_number || !driver_name || !driver_phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'hospital_id, vehicle_number, driver_name, driver_phone and password are required',
            });
        }

        const hospital = await Hospital.findByPk(hospital_id);
        if (!hospital) {
            return res.status(404).json({
                success: false,
                message: 'Hospital not found',
            });
        }

        const existingVehicle = await Ambulance.findOne({ where: { vehicle_number } });
        if (existingVehicle) {
            return res.status(409).json({
                success: false,
                message: 'Ambulance already exists with this vehicle number',
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const ambulance = await Ambulance.create({
            hospital_id,
            vehicle_number,
            driver_name,
            driver_phone,
            driver_password: hashedPassword,
            ambulance_type: ambulance_type || 'basic',
            status: 'offline',
        });

        const token = generateToken({
            id: ambulance.id,
            role: 'ambulance_driver',
            hospital_id: ambulance.hospital_id,
        });

        return res.status(201).json({
            success: true,
            message: 'Ambulance driver registered successfully',
            token,
            data: {
                id: ambulance.id,
                vehicle_number: ambulance.vehicle_number,
                driver_name: ambulance.driver_name,
                driver_phone: ambulance.driver_phone,
                hospital_id: ambulance.hospital_id,
                ambulance_type: ambulance.ambulance_type,
                role: 'ambulance_driver',
            },
        });
    } catch (error) {
        console.error('registerAmbulanceDriver error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to register ambulance driver',
        });
    }
};

/**
 * AMBULANCE DRIVER LOGIN
 */
const loginAmbulanceDriver = async (req, res) => {
    try {
        const { driver_phone, vehicle_number, password } = req.body;

        if (!driver_phone || !vehicle_number) {
            return res.status(400).json({
                success: false,
                message: 'driver_phone and vehicle_number are required',
            });
        }

        const ambulance = await Ambulance.findOne({
            where: { driver_phone, vehicle_number },
            include: [
                {
                    model: Hospital,
                    as: 'hospital',
                    attributes: ['id', 'name', 'phone', 'city', 'state'],
                },
            ],
        });

        if (!ambulance) {
            return res.status(404).json({
                success: false,
                message: 'Ambulance driver not found',
            });
        }

        if (ambulance.is_active === false) {
            return res.status(403).json({ success: false, message: 'Ambulance account is inactive' });
        }

        if (password && ambulance.driver_password) {
            const isPasswordValid = await bcrypt.compare(password, ambulance.driver_password);
            if (!isPasswordValid) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
        }

        const token = generateToken({
            id: ambulance.id,
            role: 'ambulance_driver',
            hospital_id: ambulance.hospital_id,
        });

        return res.status(200).json({
            success: true,
            message: 'Ambulance driver login successful',
            token,
            data: {
                id: ambulance.id,
                vehicle_number: ambulance.vehicle_number,
                driver_name: ambulance.driver_name,
                driver_phone: ambulance.driver_phone,
                hospital_id: ambulance.hospital_id,
                ambulance_type: ambulance.ambulance_type,
                status: ambulance.status,
                role: 'ambulance_driver',
                hospital: ambulance.hospital,
            },
        });
    } catch (error) {
        console.error('loginAmbulanceDriver error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to login ambulance driver',
        });
    }
};

/**
 * COMMON PROFILE
 */
const getMyProfile = async (req, res) => {
    try {
        const { id, role } = req.user;

        let data = null;

        if (role === 'user') {
            data = await User.findByPk(id, {
                attributes: { exclude: ['password'] },
            });
        } else if (role === 'hospital_admin') {
            data = await HospitalAdmin.findByPk(id, {
                attributes: { exclude: ['password'] },
                include: [
                    {
                        model: Hospital,
                        as: 'hospital',
                        attributes: ['id', 'name', 'phone', 'city', 'state'],
                    },
                ],
            });
        } else if (role === 'ambulance_driver') {
            data = await Ambulance.findByPk(id, {
                attributes: { exclude: ['driver_password'] },
                include: [
                    {
                        model: Hospital,
                        as: 'hospital',
                        attributes: ['id', 'name', 'phone', 'city', 'state'],
                    },
                ],
            });
        }

        if (!['user', 'hospital_admin', 'ambulance_driver'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role in token' });
        }

        if (!data) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }

        return res.status(200).json({
            success: true,
            message: 'Profile fetched successfully',
            data,
        });
    } catch (error) {
        console.error('getMyProfile error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    registerHospitalAdmin,
    loginHospitalAdmin,
    registerAmbulanceDriver,
    loginAmbulanceDriver,
    getMyProfile,
};