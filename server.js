import express from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import db from './db.js';
import spotsRouter from './routes/spots.js';
import authRouter from './routes/auth.js'
import adminRouter from './routes/admin.js';
import emailRouter from './routes/email.js'; 
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors'; 

dotenv.config();

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com', 
    port: 587, 
    secure: false, 
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false
    },
    family: 4
});

transporter.verify(function(error, success) {
    if (error) {
        console.error('Nodemailer Transporter Connection FAILED:', error);
    } else {
        console.log("Nodemailer Transporter Connection SUCCESSFUL: Ready for sending.");
    }
});

export { transporter }; 
console.log("Nodemailer transporter initialized.");

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.use('/api/spots', spotsRouter); 
app.use('/api/admin', adminRouter); 
app.use('/api/email', emailRouter); 
app.use('/api/auth', authRouter);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});