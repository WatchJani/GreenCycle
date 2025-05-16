const express = require("express")
const material = express.Router()
const DB = require('../db/dbConn.js')
const multer = require('multer')

let upload_dest = multer({ dest: 'uploads/' })

material.post('/add', upload_dest.single('file'), async (req, res) => {
    const {
        category,
        description,
        is_ecologically,
        is_sensitive,
        unit,
        name
    } = req.body;
    const file = req.file;

    const is_ecologically_bool = is_ecologically === 'true' ? true : false;
    const is_sensitive_bool = is_sensitive === 'true' ? true : false;

    if (!category || !description || !unit || !name || !file) {
        return res.status(400).json({ error: 'All fields including file are required.' });
    }

    try {
        await DB.AddMaterial({
            category,
            description,
            is_ecologically_bool,
            is_sensitive_bool,
            unit,
            name,
            file_name: file.filename
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
    const file = req.file;

    const is_ecologically_bool = is_ecologically === 'true' ? true : false;
    const is_sensitive_bool = is_sensitive === 'true' ? true : false;

    if (!category || !description || !unit || !name || !file) {
        return res.status(400).json({ error: 'All fields including file are required.' });
    }

    try {
        await DB.EditMaterial(material_id, {
            category,
            description,
            is_ecologically_bool,
            is_sensitive_bool,
            unit,
            project_id,
            name,
            file_name: file.filename
        });

        res.status(200).json({ message: 'Material successfully updated.' });
    } catch (err) {
        console.error("Error editing material:", err);
        res.status(500).json({ error: 'Server error while updating material.' });
    }
});


material.get('/search', async (req, res) => {
    const { name, is_ecologically, is_sensitive, unit } = req.query;

    try {
        const results = await DB.SearchMaterials({
            name,
            is_ecologically,
            is_sensitive,
            unit
        });

        res.status(200).json(results);
    } catch (err) {
        console.error("Error searching materials:", err);
        res.status(500).json({ error: 'Server error while filtering materials.' });
    }
});


module.exports = material