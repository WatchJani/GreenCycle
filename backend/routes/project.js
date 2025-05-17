const express = require("express");
const project = express.Router();
const DB = require('../db/dbConn.js');
const multer = require('multer');

let upload_dest = multer({ dest: 'uploads/' });

project.post('/add', upload_dest.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'images', maxCount: 10 }
]), async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Korisnik nije prijavljen.' });
    }

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

    if (!title || !description || !category || !difficulty || !time_required || !instruction) {
        return res.status(400).json({ error: 'All required fields must be filled in.' });
    }

    const parsedMaterials = materials ? JSON.parse(materials) : [];

    const thumbnailFile = req.files['thumbnail']?.[0];
    const imageFiles = req.files['images'] || [];

    const thumbnailPath = thumbnailFile ? `/uploads/${thumbnailFile.filename}.${thumbnailFile.mimetype.split('/')[1]}` : null;
    const imagePaths = imageFiles.map(file => `/uploads/${file.filename}.${file.mimetype.split('/')[1]}`);

    try {
        const projectId = await DB.CreateProject({
            title,
            description,
            category,
            difficulty,
            time_required,
            is_published: is_published === 'true' ? true : false,
            instruction,
            thumbnail: thumbnailPath,
            user: req.session.user.user_id
        }, parsedMaterials, imagePaths);

        res.status(201).json({ message: 'Project successfully created.', project_id: projectId });
    } catch (err) {
        console.error("Error adding project:", err);
        res.status(500).json({ error: 'Failed to create project.' });
    }
});

module.exports = project;