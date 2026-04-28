-- ========================
-- USERS
-- ========================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- hashed
    role ENUM('admin','cashier') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ========================
-- CATEGORIES
-- ========================
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ========================
-- SUPPLIERS
-- ========================
CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ========================
-- PRODUCTS
-- ========================
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    barcode VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,
    category_id INT,
    supplier_id INT,
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    quantity INT DEFAULT 0,
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ========================
-- CUSTOMERS
-- ========================
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ========================
-- SALES
-- ========================
CREATE TABLE IF NOT EXISTS sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    customer_id INT,

    subtotal DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,

    amount_paid DECIMAL(10,2) NOT NULL,
    change_amount DECIMAL(10,2) NOT NULL,

    currency VARCHAR(10) NOT NULL,
    exchange_rate DECIMAL(10,2) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ========================
-- SALE ITEMS
-- ========================
CREATE TABLE IF NOT EXISTS sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,

    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ========================
-- SETTINGS
-- ========================
CREATE TABLE IF NOT EXISTS settings (
    `key` VARCHAR(100) PRIMARY KEY,
    value TEXT
) ENGINE=InnoDB;

-- ========================
-- INVENTORY LOG
-- ========================
CREATE TABLE IF NOT EXISTS inventory_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    change_type ENUM('sale','restock','adjustment') NOT NULL,
    quantity INT NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ========================
-- SEED DATA
-- ========================
INSERT IGNORE INTO users (name, username, password, role) VALUES 
('Super Admin', 'root', '1234', 'admin'),
('Admin User', 'admin', 'admin123', 'admin'),
('Cashier One', 'cashier', 'cashier123', 'cashier');

INSERT IGNORE INTO settings (`key`, value) VALUES 
('store_name', 'Transactly Supermarket'),
('store_address', 'Beirut, Lebanon'),
('currency', 'USD'),
('exchange_rate', '89500'),
('language', 'en'),
('tax_rate', '11');

INSERT IGNORE INTO categories (name) VALUES 
('Groceries'),
('Beverages'),
('Snacks'),
('Personal Care');

INSERT IGNORE INTO suppliers (name, contact_person, phone, email, address) VALUES 
('ABC Distributors', 'John Doe', '+961 1 234567', 'john@abc.com', 'Beirut, Lebanon'),
('XYZ Suppliers', 'Jane Smith', '+961 3 456789', 'jane@xyz.com', 'Tripoli, Lebanon');

INSERT IGNORE INTO customers (name, phone, email, address) VALUES 
('Walk-in Customer', NULL, NULL, NULL),
('Ahmad Ali', '+961 70 123456', 'ahmad@example.com', 'Beirut'),
('Fatima Hassan', '+961 71 654321', 'fatima@example.com', 'Saida');

INSERT IGNORE INTO products (barcode, name, category_id, supplier_id, price, cost, quantity) VALUES 
('123456789012', 'Milk 1L', 1, 1, 2.50, 2.00, 50),
('123456789013', 'Bread Loaf', 1, 1, 1.00, 0.80, 30),
('123456789014', 'Coca Cola 330ml', 2, 2, 1.50, 1.20, 100),
('123456789015', 'Lays Chips 150g', 3, 2, 2.00, 1.50, 40),
('123456789016', 'Toothpaste 100g', 4, 1, 3.00, 2.50, 20);
