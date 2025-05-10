const express = require("express")
const material = express.Router()
const DB = require('../db/dbConn.js')

material.post('/add', async (req, res) => {
    const {
        category,
        description,
        is_ecologically,
        is_sensitive,
        unit,
        name
    } = req.body;

    try {
        await DB.AddMaterial({
            category,
            description,
            is_ecologically,
            is_sensitive,
            unit,
            name
        });

        res.status(201).json({ message: 'Material successfully added.' });
    } catch (err) {
        console.error("Error adding material:", err);
        res.status(500).json({ error: 'Server error while adding material.' });
    }
});


material.delete('/:material_id', async (req, res) => {
    const { material_id } = req.params;

    try {
        await DB.DeleteMaterial(material_id);
        res.status(200).json({ message: 'Material successfully deleted.' });
    } catch (err) {
        console.error("Error deleting material:", err);
        res.status(500).json({ error: 'Server error while deleting material.' });
    }
});

material.put('/:material_id', async (req, res) => {
    const { material_id } = req.params;
    const {
        category,
        description,
        is_ecologically,
        is_sensitive,
        unit,
        project_id,
        name
    } = req.body;

    try {
        await DB.EditMaterial(material_id, {
            category,
            description,
            is_ecologically,
            is_sensitive,
            unit,
            project_id,
            name
        });

        res.status(200).json({ message: 'Material successfully updated.' });
    } catch (err) {
        console.error("Error editing material:", err);
        res.status(500).json({ error: 'Server error while updating material.' });
    }
});


module.exports = material