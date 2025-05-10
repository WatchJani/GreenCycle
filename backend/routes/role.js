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

role.post('/', async (req, res) => {
    try {
        const users = await DB.GetUsersWithPermissions();
        res.status(200).json(users);
    } catch (err) {
        console.error("Error fetching users with permissions:", err);
        res.status(500).json({ error: 'Server error while fetching users and permissions.' });
    }
});

role.delete('/', async (req, res) => {
    try {
        const users = await DB.GetUsersWithPermissions();
        res.status(200).json(users);
    } catch (err) {
        console.error("Error fetching users with permissions:", err);
        res.status(500).json({ error: 'Server error while fetching users and permissions.' });
    }
});

module.exports = role