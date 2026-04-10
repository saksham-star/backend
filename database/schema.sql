-- RescueNow / emergency_db
CREATE DATABASE IF NOT EXISTS emergency_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE emergency_db;

-- TABLE 1: users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL UNIQUE,
  email VARCHAR(100),
  password VARCHAR(255),
  age INT,
  gender ENUM('male','female','other'),
  blood_group ENUM('A+','A-','B+','B-','O+','O-','AB+','AB-'),
  allergies TEXT,
  address TEXT,
  city VARCHAR(50),
  state VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_phone (phone),
  INDEX idx_city (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 2: emergency_contacts
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  relationship ENUM('father','mother','spouse','sibling','child','friend','relative','other') DEFAULT 'other',
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  CONSTRAINT fk_ec_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 3: medical_conditions
CREATE TABLE IF NOT EXISTS medical_conditions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  condition_name VARCHAR(150) NOT NULL,
  severity ENUM('mild','moderate','severe','critical') DEFAULT 'moderate',
  diagnosed_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  CONSTRAINT fk_mc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 4: hospitals
CREATE TABLE IF NOT EXISTS hospitals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(15) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(50),
  state VARCHAR(50),
  pincode VARCHAR(10),
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  total_beds INT DEFAULT 50,
  available_beds INT DEFAULT 50,
  icu_beds INT DEFAULT 10,
  available_icu INT DEFAULT 10,
  specialties VARCHAR(500),
  rating DECIMAL(2,1) DEFAULT 4.0,
  is_24x7 BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_location (latitude, longitude),
  INDEX idx_city (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 5: hospital_admins
CREATE TABLE IF NOT EXISTS hospital_admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(15),
  role ENUM('admin','staff','doctor') DEFAULT 'staff',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_hospital (hospital_id),
  CONSTRAINT fk_ha_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 6: ambulances
CREATE TABLE IF NOT EXISTS ambulances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NOT NULL,
  vehicle_number VARCHAR(20) NOT NULL UNIQUE,
  driver_name VARCHAR(100) NOT NULL,
  driver_phone VARCHAR(15) NOT NULL,
  driver_password VARCHAR(255),
  ambulance_type ENUM('basic','advanced','icu') DEFAULT 'basic',
  current_lat DECIMAL(10,8),
  current_lng DECIMAL(11,8),
  status ENUM('available','busy','offline','maintenance') DEFAULT 'offline',
  last_location_update TIMESTAMP NULL,
  total_trips INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_location (current_lat, current_lng),
  CONSTRAINT fk_amb_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 7: incidents
CREATE TABLE IF NOT EXISTS incidents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  ambulance_id INT NULL,
  hospital_id INT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  address TEXT,
  incident_type ENUM('accident','medical','fire','crime','other') DEFAULT 'medical',
  severity ENUM('low','medium','high','critical') DEFAULT 'high',
  trigger_type ENUM('manual','auto_crash','voice') DEFAULT 'manual',
  description TEXT,
  status ENUM('pending','assigned','enroute_pickup','reached_pickup','patient_picked','enroute_hospital','reached_hospital','completed','cancelled') DEFAULT 'pending',
  response_time_seconds INT NULL,
  total_duration_seconds INT NULL,
  estimated_eta_minutes INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_at TIMESTAMP NULL,
  picked_up_at TIMESTAMP NULL,
  reached_hospital_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  cancelled_at TIMESTAMP NULL,
  cancellation_reason TEXT,
  INDEX idx_status (status),
  INDEX idx_user (user_id),
  INDEX idx_created (created_at),
  CONSTRAINT fk_inc_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_inc_ambulance FOREIGN KEY (ambulance_id) REFERENCES ambulances(id) ON DELETE SET NULL,
  CONSTRAINT fk_inc_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 8: incident_timeline
CREATE TABLE IF NOT EXISTS incident_timeline (
  id INT AUTO_INCREMENT PRIMARY KEY,
  incident_id INT NOT NULL,
  status VARCHAR(50) NOT NULL,
  message TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  created_by ENUM('system','user','driver','hospital') DEFAULT 'system',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_incident (incident_id),
  CONSTRAINT fk_it_incident FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 9: notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  incident_id INT NULL,
  type ENUM('sms','call','email','push','socket') NOT NULL,
  recipient_type ENUM('user','family','driver','hospital','police') NOT NULL,
  recipient_name VARCHAR(100),
  recipient_contact VARCHAR(100) NOT NULL,
  message TEXT,
  status ENUM('pending','sent','failed','delivered') DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_incident_notif (incident_id),
  CONSTRAINT fk_notif_incident FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
