const express = require("express")
const role = express.Router()
const DB = require('../db/dbConn.js')

role.get('/', async (req, res) => {
    try {
        const users = await DB.GetUsersWithPermissions();
        res.status(200).json(users);
    } catch (err) {
        console.error("Error fetching users with permissions:", err);
        res.status(500).json({ error: 'Server error while fetching users and permissions.' });
    }
});

role.post('/assign', async (req, res) => {
    const sessionUser = req.session.user;


    console.log(sessionUser.roles)

    if (!sessionUser || !sessionUser.roles || !sessionUser.roles.includes('admin')) {
        return res.status(403).json({ error: 'Only admins can assign roles.' });
    }

    const { user_id, role_id } = req.body;


    if (!user_id || !role_id) {
        return res.status(400).json({ error: 'Missing user_id or role_id.' });
    }

    try {
        await DB.AssignRoleToUser(user_id, role_id);
        return res.status(200).json({ message: 'Role assigned successfully.' });
    } catch (err) {
        console.error("Error assigning role:", err.err || err);
        return res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
    }
});

role.delete('/', async (req, res) => {
    const sessionUser = req.session.user;

    if (!sessionUser || !sessionUser.roles || !sessionUser.roles.includes('admin')) {
        return res.status(403).json({ error: 'Only admins can remove roles.' });
    }

    const { user_id, role_id } = req.body;

    if (!user_id || !role_id) {
        return res.status(400).json({ error: 'Missing user_id or role_id.' });
    }

    try {
        const result = await DB.RemoveUserRole(user_id, role_id);
        return res.status(200).json(result);
    } catch (err) {
        console.error("Error removing role:", err.err || err);
        return res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
    }
});

module.exports = role