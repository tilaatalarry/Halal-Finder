import express from 'express';
import db from '../db.js';
import authMiddleware from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

const router = express.Router();
router.use(authMiddleware, adminMiddleware);

router.get('/all_spots', async (req, res) => {
    try {
        const sql = `SELECT id, name, address, type, rating, lat, lng, image_path, approved, submitted_by_email FROM spots ORDER BY approved ASC, id DESC`;
        const [spots] = await db.execute(sql);
        
        console.log(`Admin fetched ${spots.length} spots.`);
        res.json(spots);
    } catch (error) {
        console.error('Error fetching all spots for admin:', error);
        res.status(500).json({ error: 'Failed to fetch all spots' });
    }
});

router.put('/approve/:spotId', async (req, res) => {
    const { spotId } = req.params;
    
    try {
        const [spotData] = await db.execute(`SELECT name, submitted_by_email FROM spots WHERE id = ?`, [spotId]);
        
        if (spotData.length === 0) {
            return res.status(404).json({ error: 'Spot not found.' });
        }
        
        const { name: spotName, submitted_by_email: submittedEmail } = spotData[0];
        const updateSql = `UPDATE spots SET approved = 1 WHERE id = ?`;
        const [result] = await db.execute(updateSql, [spotId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Spot not found or status update failed.' });
        }
        
        res.json({ 
            success: true, 
            message: `Spot ${spotId} approved successfully.`,
            spotDetails: { spotName, submittedEmail } 
        });
        
    } catch (error) {
        console.error(`Error approving spot ID ${spotId}:`, error);
        res.status(500).json({ error: 'Failed to approve spot' });
    }
});

router.delete('/delete/:spotId', async (req, res) => {
    const { spotId } = req.params;
    
    try {
        const sql = `DELETE FROM spots WHERE id = ?`;
        const [result] = await db.execute(sql, [spotId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Spot not found.' });
        }

        res.json({ success: true, message: `Spot ${spotId} deleted successfully.` });
    } catch (error) {
        console.error(`Error deleting spot ID ${spotId}:`, error);
        res.status(500).json({ error: 'Failed to delete spot' });
    }
});

router.get('/users', async (req, res) => {
    try {
        const sql = `SELECT id, email, role FROM users`;
        const [users] = await db.execute(sql);
        res.json(users);
    } catch (error) {
        console.error('Failed to fetch users:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});


export default router;