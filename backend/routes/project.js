const express = require("express")
const project = express.Router()
const DB = require('../db/dbConn.js')


project.post('/add', async (req, res) => {
    const {
        title,
        description,
        category,
        difficulty,
        time_required,
        is_published,
        instruction,
        materials
    } = req.body;

    try {
        const projectId = await DB.CreateProject({
            title,
            description,
            category,
            difficulty,
            time_required,
            is_published,
            instruction
        }, materials);

        res.status(201).json({ message: 'Project successfully created.', project_id: projectId });
    } catch (err) {
        console.error("Error adding project:", err);
        res.status(500).json({ error: 'Failed to create project.' });
    }
});




module.exports = project