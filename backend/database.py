import pymysql
import os

DB_CONFIG = {
    'host': os.getenv('DB_HOST'),
    'port': int(os.getenv('DB_PORT')),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_NAME'),
    'ssl': {'ssl_mode': 'REQUIRED'}
}

def get_db_connection():
    return pymysql.connect(**DB_CONFIG)

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS barcode_user (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            department INT,
            role INT DEFAULT 2,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS barcode_scans (
            id INT AUTO_INCREMENT PRIMARY KEY,
            barcode VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (email) REFERENCES barcode_user(email)
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS shipping_lists (
            id INT AUTO_INCREMENT PRIMARY KEY,
            list_name VARCHAR(255) UNIQUE NOT NULL,
            uploaded_by_email VARCHAR(255) NOT NULL,
            upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (uploaded_by_email) REFERENCES barcode_user(email)
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Barcode_Info (
            id INT AUTO_INCREMENT PRIMARY KEY,
            images JSON,
            barcode VARCHAR(255) NOT NULL,
            date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            full_name VARCHAR(255),
            department INT,
            email VARCHAR(255) NOT NULL,
            shipping_list_id INT NULL, /* New column to link to shipping lists */
            FOREIGN KEY (email) REFERENCES barcode_user(email),
            FOREIGN KEY (shipping_list_id) REFERENCES shipping_lists(id)
        )
    """)

    # Add new columns to Barcode_Info if they don't exist
    for column, col_type in [
        ('customer_name', 'VARCHAR(255)'),
        ('expected_ship_date', 'DATE'),
        ('bol_number', 'VARCHAR(255)'),
        ('shipping_list_id', 'INT') # Add shipping_list_id to the check
    ]:
        cursor.execute(f"""
            SELECT COUNT(*)
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = '{DB_CONFIG['database']}'
            AND TABLE_NAME = 'Barcode_Info'
            AND COLUMN_NAME = '{column}'
        """)
        if cursor.fetchone()[0] == 0:
            cursor.execute(f"ALTER TABLE Barcode_Info ADD COLUMN {column} {col_type} NULL;")


    # Drop the 'image' column if it exists, as it's replaced by 'images' JSON column
    cursor.execute(f"""
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = '{DB_CONFIG['database']}'
        AND TABLE_NAME = 'Barcode_Info'
        AND COLUMN_NAME = 'image'
    """)
    if cursor.fetchone()[0] > 0:
        cursor.execute("ALTER TABLE Barcode_Info DROP COLUMN image;")

    # Insert admin user if not exists
    cursor.execute("SELECT * FROM barcode_user WHERE email = 'jackchristian449@gmail.com'")
    if not cursor.fetchone():
        cursor.execute(
            "INSERT INTO barcode_user (email, password, first_name, last_name, department, role) VALUES (%s, %s, %s, %s, %s, %s)",
            ('jackchristian449@gmail.com', 'admin123', 'Jack', 'Christian', None, 1)
        )
    
    # Task 18: Update role and department for jackchristian449@gmail.com
    cursor.execute("SELECT * FROM barcode_user WHERE email = 'lkszpchck@gmail.com'")
    if cursor.fetchone(): # Only update if user exists
        cursor.execute(
            "UPDATE barcode_user SET role = %s, department = %s WHERE email = %s",
            (2, 1, 'lkszpchck@gmail.com')
        )

    # Task 19: Add new admin Ikszpchck@gmail.com or ensure correct password
    cursor.execute("SELECT id FROM barcode_user WHERE email = 'jackchristian449@gmail.com'")
    user_exists = cursor.fetchone()

    if user_exists:
        # If user exists, ensure their password and role are correct
        cursor.execute(
            "UPDATE barcode_user SET password = %s, first_name = %s, last_name = %s, department = %s, role = %s WHERE id = %s",
            ('admin123', 'Jack', 'Christian', None, 1, user_exists[0])
        )
    else:
        # If user does not exist, insert them
        cursor.execute(
            "INSERT INTO barcode_user (email, password, first_name, last_name, department, role) VALUES (%s, %s, %s, %s, %s, %s)",
            ('jackchristian449@gmail.com', 'admin123', 'Jack', 'Christian', None, 1)
        )
    
    conn.commit()
    cursor.close()
    conn.close()

