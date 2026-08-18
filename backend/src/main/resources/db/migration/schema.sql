


CREATE DATABASE IF NOT EXISTS parking_violation_db;
USE parking_violation_db;

-- 1. Users table (Admin, Officer, Vehicle Owner - single table with role)
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'OFFICER', 'OWNER') NOT NULL,
    phone VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Vehicle table (belongs to a Vehicle Owner)
CREATE TABLE vehicle (
    vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_number VARCHAR(20) UNIQUE NOT NULL,
    owner_id INT NULL,
    vehicle_type VARCHAR(50),
    FOREIGN KEY (owner_id) REFERENCES users(user_id)
);

-- 3. Violation Category table (managed by Admin)
CREATE TABLE violation_category (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    fine_amount DECIMAL(10,2) NOT NULL,
    description VARCHAR(255)
);

-- 4. Violation table (recorded by Officer)

CREATE TABLE violation (
    violation_id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    officer_id INT NOT NULL,
    category_id INT NOT NULL,
    location VARCHAR(255) NOT NULL,
    photo_url VARCHAR(255) NOT NULL,
    fine_amount DECIMAL(10,2) NOT NULL,
    fine_status ENUM('PENDING', 'PAID', 'WAIVED') DEFAULT 'PENDING',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicle(vehicle_id),
    FOREIGN KEY (officer_id) REFERENCES users(user_id),
    FOREIGN KEY (category_id) REFERENCES violation_category(category_id)
);

-- 5. Appeal table (submitted by Vehicle Owner, resolved by Admin)

CREATE TABLE appeal (
    appeal_id INT AUTO_INCREMENT PRIMARY KEY,
    violation_id INT NOT NULL,
    owner_id INT NOT NULL,
    reason TEXT NOT NULL,
    counter_evidence_url VARCHAR(255),
    status ENUM('SUBMITTED', 'UNDER_REVIEW', 'EVIDENCE_REVIEWED', 'APPROVED', 'CANCELLED') DEFAULT 'SUBMITTED',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (violation_id) REFERENCES violation(violation_id),
    FOREIGN KEY (owner_id) REFERENCES users(user_id)
);
USE parking_violation_db;
