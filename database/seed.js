/**
 * Seed demo data for RescueNow (Jamshedpur area).
 * Run: npm run seed  (from project root)
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const ROUNDS = 10;

async function clearTables(conn) {
  await conn.query('SET FOREIGN_KEY_CHECKS = 0');
  await conn.query('TRUNCATE TABLE notifications');
  await conn.query('TRUNCATE TABLE incident_timeline');
  await conn.query('TRUNCATE TABLE incidents');
  await conn.query('TRUNCATE TABLE ambulances');
  await conn.query('TRUNCATE TABLE hospital_admins');
  await conn.query('TRUNCATE TABLE medical_conditions');
  await conn.query('TRUNCATE TABLE emergency_contacts');
  await conn.query('TRUNCATE TABLE users');
  await conn.query('TRUNCATE TABLE hospitals');
  await conn.query('SET FOREIGN_KEY_CHECKS = 1');
}

async function seed() {
  const conn = await pool.getConnection();
  try {
    await clearTables(conn);

    const hospitalsData = [
      {
        name: 'Tata Main Hospital',
        email: 'info@tatamainhospital.org',
        phone: '06572431000',
        address: 'Bistupur, Jamshedpur',
        city: 'Jamshedpur',
        state: 'Jharkhand',
        pincode: '831001',
        latitude: 22.7925,
        longitude: 86.1842,
        slug: 'tata-main',
      },
      {
        name: 'Brahmananda Narayana Multispeciality Hospital',
        email: 'contact@bnhospital.in',
        phone: '06572435000',
        address: 'Tamolia, Jamshedpur',
        city: 'Jamshedpur',
        state: 'Jharkhand',
        pincode: '831004',
        latitude: 22.8046,
        longitude: 86.2029,
        slug: 'brahmananda-narayana',
      },
      {
        name: 'Mercy Hospital',
        email: 'mercy@sakchi.in',
        phone: '06572436000',
        address: 'Sakchi, Jamshedpur',
        city: 'Jamshedpur',
        state: 'Jharkhand',
        pincode: '831001',
        latitude: 22.8,
        longitude: 86.19,
        slug: 'mercy-hospital',
      },
      {
        name: 'Tinplate Hospital',
        email: 'tinplate@golmuri.in',
        phone: '06572437000',
        address: 'Golmuri, Jamshedpur',
        city: 'Jamshedpur',
        state: 'Jharkhand',
        pincode: '831003',
        latitude: 22.81,
        longitude: 86.22,
        slug: 'tinplate',
      },
      {
        name: 'Meherbai Tata Cancer Hospital',
        email: 'info@mtch.in',
        phone: '06572438000',
        address: 'Northern Town, Jamshedpur',
        city: 'Jamshedpur',
        state: 'Jharkhand',
        pincode: '831001',
        latitude: 22.78,
        longitude: 86.17,
        slug: 'meherbai-tata',
      },
    ];

    const hospitalIds = [];
    for (const h of hospitalsData) {
      const [r] = await conn.query(
        `INSERT INTO hospitals (name, email, phone, address, city, state, pincode, latitude, longitude, total_beds, available_beds, icu_beds, available_icu, specialties, rating, is_24x7, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 80, 75, 15, 12, 'Emergency, Trauma, Cardiology', 4.5, TRUE, TRUE)`,
        [
          h.name,
          h.email,
          h.phone,
          h.address,
          h.city,
          h.state,
          h.pincode,
          h.latitude,
          h.longitude,
        ]
      );
      hospitalIds.push({ id: r.insertId, ...h });
    }

    const adminPass = await bcrypt.hash('admin123', ROUNDS);
    for (const h of hospitalIds) {
      await conn.query(
        `INSERT INTO hospital_admins (hospital_id, name, email, password, phone, role, is_active)
         VALUES (?, ?, ?, ?, ?, 'admin', TRUE)`,
        [
          h.id,
          `Admin ${h.name}`,
          `admin@${h.slug}.com`,
          adminPass,
          '06570000000',
        ]
      );
    }

    const driverPass = await bcrypt.hash('driver123', ROUNDS);

    const ambulances = [
      // Tata Main (2)
      {
        hospitalIndex: 0,
        vehicle_number: 'JH05AB1234',
        driver_name: 'Rajesh Kumar',
        driver_phone: '9876501111',
        type: 'advanced',
        lat: 22.7925,
        lng: 86.1842,
      },
      {
        hospitalIndex: 0,
        vehicle_number: 'JH05AC5678',
        driver_name: 'Suresh Yadav',
        driver_phone: '9876501112',
        type: 'basic',
        lat: 22.793,
        lng: 86.185,
      },
      // Brahmananda (2)
      {
        hospitalIndex: 1,
        vehicle_number: 'JH05BD9012',
        driver_name: 'Amit Singh',
        driver_phone: '9876502221',
        type: 'icu',
        lat: 22.8046,
        lng: 86.2029,
      },
      {
        hospitalIndex: 1,
        vehicle_number: 'JH05BE3456',
        driver_name: 'Vikram Das',
        driver_phone: '9876502222',
        type: 'advanced',
        lat: 22.805,
        lng: 86.2035,
      },
      // Mercy (2)
      {
        hospitalIndex: 2,
        vehicle_number: 'JH05CF7890',
        driver_name: 'Pradeep Mahto',
        driver_phone: '9876503331',
        type: 'basic',
        lat: 22.8005,
        lng: 86.1905,
      },
      {
        hospitalIndex: 2,
        vehicle_number: 'JH05CG2468',
        driver_name: 'Manoj Tiwari',
        driver_phone: '9876503332',
        type: 'basic',
        lat: 22.7995,
        lng: 86.1895,
      },
      // Tinplate (1)
      {
        hospitalIndex: 3,
        vehicle_number: 'JH05DH1357',
        driver_name: 'Sanjay Mandal',
        driver_phone: '9876504441',
        type: 'basic',
        lat: 22.8102,
        lng: 86.2205,
      },
      // Meherbai (1)
      {
        hospitalIndex: 4,
        vehicle_number: 'JH05EK9753',
        driver_name: 'Ravi Shankar',
        driver_phone: '9876505551',
        type: 'advanced',
        lat: 22.7805,
        lng: 86.1705,
      },
    ];

    for (const a of ambulances) {
      const hid = hospitalIds[a.hospitalIndex].id;
      await conn.query(
        `INSERT INTO ambulances (hospital_id, vehicle_number, driver_name, driver_phone, driver_password, ambulance_type, current_lat, current_lng, status, last_location_update, total_trips, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'available', NOW(), 0, TRUE)`,
        [hid, a.vehicle_number, a.driver_name, a.driver_phone, driverPass, a.type, a.lat, a.lng]
      );
    }

    const userPass = await bcrypt.hash('test123', ROUNDS);
    const [ur] = await conn.query(
      `INSERT INTO users (name, phone, email, password, age, gender, blood_group, allergies, address, city, state, is_active)
       VALUES (?, ?, ?, ?, 25, 'male', 'O+', 'None known', 'Bistupur', 'Jamshedpur', 'Jharkhand', TRUE)`,
      ['Aarav Kumar', '9999999999', 'aarav@example.com', userPass]
    );
    const userId = ur.insertId;

    await conn.query(
      `INSERT INTO emergency_contacts (user_id, name, phone, relationship, is_primary) VALUES
       (?, 'Ramesh Kumar', '9888888888', 'father', TRUE),
       (?, 'Sunita Kumar', '9777777777', 'mother', FALSE)`,
      [userId, userId]
    );

    await conn.query(
      `INSERT INTO medical_conditions (user_id, condition_name, severity, diagnosed_date, notes, is_active) VALUES
       (?, 'Type 2 Diabetes', 'moderate', '2022-01-15', 'On medication', TRUE),
       (?, 'Hypertension', 'mild', '2023-06-01', 'Lifestyle management', TRUE)`,
      [userId, userId]
    );

    console.log('Seed completed successfully.');
    console.log('Demo user: phone 9999999999 / password test123');
    console.log('Driver sample: vehicle JH05AB1234 / phone 9876501111 / password driver123');
    console.log('Hospital admin: admin@tata-main.com / admin123');
  } catch (e) {
    console.error('Seed failed:', e);
    process.exitCode = 1;
  } finally {
    conn.release();
    await pool.end();
  }
}

seed();
