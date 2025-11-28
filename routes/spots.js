import express from 'express';
import multer from 'multer';
import path from 'path';
import db from '../db.js'; 
import authMiddleware from '../middleware/authMiddleware.js';
import { transporter } from '../server.js'; 

const router = express.Router();
const upload = multer({ dest: 'public/uploads/' });

const sendAwaitingApprovalEmail = async (spotName, recipientEmail) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipientEmail,
        subject: 'Halal Finder: Spot Submission Received - Awaiting Approval',
        text: `Hello,\n\nThank you for submitting "${spotName}" to Halal Finder.\n\nYour spot has been received and is currently in our moderation queue awaiting approval by our admin team. We will notify you via this email once it goes live.\n\nThank you for contributing to the community!`,
        html: `<p>Hello,</p>
               <p>Thank you for submitting <strong>${spotName}</strong> to Halal Finder.</p>
               <p>Your spot has been received and is currently in our moderation queue awaiting approval by our admin team. We will notify you via this email once it goes live.</p>
               <p>Thank you for contributing to the community!</p>`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Awaiting approval email sent to ${recipientEmail} for spot: ${spotName}`);
    } catch (error) {
        console.error('Email failed to send for awaiting approval:', error);
    }
};

router.get('/', async (req, res) => {
    const { search, type, address } = req.query;
    let sql = `
        SELECT id, name, type, address, rating, lat, lng, image_path, submitted_by_email, approved
        FROM spots WHERE approved = 1
    `; 
    let params = [];
    let whereClauses = [];
    
    if (search) {
        whereClauses.push('(name LIKE ? OR address LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
    }
    
    if (type && type !== 'all') {
        whereClauses.push('type = ?');
        params.push(type);
    }
    
    if (address) {
        whereClauses.push('address = ?');
        params.push(address);
    }

    if (whereClauses.length > 0) {
        sql += ' AND ' + whereClauses.join(' AND ');
    }

    try {
        const [spots] = await db.execute(sql, params);
        res.json(spots); 
    } catch (error) {
        console.error('Error fetching spots:', error);
        res.status(500).json({ error: 'Failed to fetch spots' });
    }
});

router.post('/submit', upload.single('image'), authMiddleware, async (req, res) => {
    console.log('--- Incoming Spot Body Data:', req.body);
    const { name, address, type, rating, lat, lng } = req.body;
    const spotName = name;
    const spotAddress = address;
    const spotType = type;
    const spotRating = rating;
    const spotLat = lat;
    const spotLng = lng;

    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
    const submitted_by_email = req.user ? req.user.email : null; 
    
    console.log('Server Received Data:', { spotName, spotAddress, spotLat, spotLng });
    console.log('Server Submitted Email:', submitted_by_email);

    if (!spotName || !spotAddress || !spotLat || !spotLng || !submitted_by_email) {
        console.error('Missing Required Fields:', { 
            name: spotName, 
            address: spotAddress, 
            lat: spotLat, 
            lng: spotLng, 
            email: submitted_by_email 
        });
        return res.status(400).json({ error: "Missing required spot details." });
    }

    try {
        const sql = `INSERT INTO spots (name, address, type, rating, lat, lng, image_path, approved, submitted_by_email) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`;
                     
        const [result] = await db.execute(sql, [
            spotName, spotAddress, spotType, spotRating, spotLat, spotLng, imagePath, submitted_by_email
        ]);
        
        if (result.affectedRows === 0) {
            throw new Error('Spot insertion failed.');
        }
        await sendAwaitingApprovalEmail(spotName, submitted_by_email);
        
        res.json({ 
            success: true, 
            message: "Spot submitted successfully. It is now awaiting admin approval before going live." 
        });

    } catch (error) {
        console.error('Error submitting spot:', error);
        res.status(500).json({ error: 'Failed to submit spot' });
    }
});

export default router;