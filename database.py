import sqlite3

# Connect to SQLite Database
connection = sqlite3.connect("ecorisk.db")

cursor = connection.cursor()

# Create Users Table
cursor.execute("""
CREATE TABLE IF NOT EXISTS users(

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    fullname TEXT NOT NULL,

    email TEXT UNIQUE NOT NULL,

    mobile TEXT UNIQUE NOT NULL,

    password TEXT NOT NULL

)
""")

connection.commit()

print("===================================")
print(" EcoRisk Database Created Successfully ")
print("===================================")

connection.close()