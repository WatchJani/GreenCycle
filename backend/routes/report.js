const express = require("express")
const report = express.Router()
const DB = require('../db/dbConn.js')

report.post('/', async (req, res) => {
    const { type, reason, project_id } = req.body;

    if (!req.session.user) {
        return res.status(401).json({ error: 'You must be logged in to submit a report.' });
    }

    const user_id = req.session.user.user_id;

    if (!type || !reason || !project_id) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        const reportId = await DB.AddReport({ type, reason, user_id, project_id });
        res.status(201).json({ message: 'Report submitted successfully.', reportId });
    } catch (err) {
        console.error('Error creating report:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});


module.exports = report;