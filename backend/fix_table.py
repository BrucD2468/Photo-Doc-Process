from database import get_db_connection

conn = get_db_connection()
cursor = conn.cursor()

print("Dropping old Barcode_Info table...")
cursor.execute("DROP TABLE IF EXISTS Barcode_Info")

print("Creating new Barcode_Info table with nullable department...")
cursor.execute("""
    CREATE TABLE Barcode_Info (
        id INT AUTO_INCREMENT PRIMARY KEY,
        image LONGTEXT NOT NULL,
        barcode VARCHAR(255) NOT NULL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        full_name VARCHAR(255) NOT NULL,
        department INT,
        email VARCHAR(255) NOT NULL,
        FOREIGN KEY (email) REFERENCES barcode_user(email)
    )
""")

conn.commit()
cursor.close()
conn.close()
print("Table recreated successfully! Department is now nullable.")
print("Restart your backend server and try again.")
