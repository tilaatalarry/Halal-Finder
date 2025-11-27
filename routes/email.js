import express from 'express';
import { transporter } from '../server.js';
import authMiddleware from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

const router = express.Router();

const sendSpotApprovedEmail = async (spotName, recipientEmail) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipientEmail,
        subject: 'Halal Finder: Your Spot Has Been Approved!',
        text: `Hello,\n\nGreat news! Your submitted spot, "${spotName}", has been approved by our admin team and is now live on the Halal Finder map.\n\nThank you for helping us grow the community!`,
        html: `<p>Hello,</p>
               <p>Great news! Your submitted spot, <strong>${spotName}</strong>, has been approved by our admin team and is now live on the Halal Finder map.</p>
               <p>Thank you for helping us grow the community!</p>`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Approval confirmation email sent to ${recipientEmail} for spot: ${spotName}`);
    } catch (error) {
        console.error('Email failed to send for spot approval:', error);
    }
};

router.post('/spot_approved', authMiddleware, adminMiddleware, async (req, res) => {
    const { spotName, submittedEmail } = req.body;
    
    if (!spotName || !submittedEmail) {
        return res.status(400).json({ error: 'Missing spot name or recipient email.' });
    }

    try {
        await sendSpotApprovedEmail(spotName, submittedEmail);
        res.json({ success: true, message: 'Approval email successfully queued.' });
    } catch (error) {
        console.error('API Error sending spot approved email:', error);
        res.status(202).json({ success: false, message: 'Email failed to send, but spot is approved.' });
    }
});

export default router;