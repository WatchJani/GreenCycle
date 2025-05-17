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

report.put('/:report_id/status', async (req, res) => {
    const { report_id } = req.params;
    const { status } = req.body;

    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized: user not logged in.' });
    }

    const userRoles = req.session.user.roles || [];
    if (!userRoles.includes('moderator') && !userRoles.includes('admin')) {
        return res.status(403).json({ error: 'Forbidden: insufficient permissions.' });
    }

    if (!status) {
        return res.status(400).json({ error: 'Status is required.' });
    }

    try {
        await DB.UpdateReportStatus(report_id, status);
        res.status(200).json({ message: 'Report status updated successfully.' });
    } catch (err) {
        console.error('Error updating report status:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});


module.exports = report;