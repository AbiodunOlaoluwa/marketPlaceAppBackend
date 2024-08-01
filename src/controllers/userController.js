import pool from "../models/db.js";

const getUserProfile = async (req, res) => {
    const {id} = req.params;
    try {
        const user = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (user.rowCount === 0) {
            return res.status(404).json({error: 'User not found'});
        }
        res.json(user.rows[0]);
    } catch (error) {
        res.status(500).json({error: 'Failed to retrieve user profile'});
    }
};

export default getUserProfile;