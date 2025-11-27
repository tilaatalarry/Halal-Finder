import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

const initDb = async () => {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'user'
            )
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS spots (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                address VARCHAR(255),
                type VARCHAR(50),
                rating DECIMAL(2,1),
                lat DOUBLE NOT NULL,
                lng DOUBLE NOT NULL,
                image_path VARCHAR(255),
                approved TINYINT DEFAULT 0, 
                submitted_by_email VARCHAR(255)
            )
        `);
        console.log("Database schema synchronized (MySQL tables checked).");

    } catch (error) {
        console.error("Error initializing MySQL database schema:", error);
        process.exit(1); 
    }
};

initDb();

console.log("Connected to MySQL database");

export default db;