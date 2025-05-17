const express = require("express");
const project = express.Router();
const DB = require('../db/dbConn.js');
const multer = require('multer');

let upload_dest = multer({ dest: 'uploads/' });

project.post('/', upload_dest.fields([
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

project.put('/:project_id', upload_dest.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'images', maxCount: 10 }
]), async (req, res) => {
    const { project_id } = req.params;
    const body = req.body;

    const thumbnailFile = req.files?.thumbnail?.[0];
    const imageFiles = req.files?.images || [];

    let updates = {};

    if (body.title) updates.title = body.title;
    if (body.description) updates.description = body.description;
    if (body.category) updates.category = body.category;
    if (body.difficulty) updates.difficulty = body.difficulty;
    if (body.time_required) updates.time_requied = body.time_required;
    if (body.instruction) updates.instruction = body.instruction;
    if (body.is_published !== undefined) {
        updates.is_published = body.is_published === 'true' ? 1 : 0;
    }

    if (thumbnailFile) {
        const ext = thumbnailFile.mimetype.split('/')[1];
        updates.thumbnail = `/uploads/${thumbnailFile.filename}.${ext}`;
    }

    if (
        Object.keys(updates).length === 0 &&
        imageFiles.length === 0 &&
        !body.materials
    ) {
        return res.status(400).json({ error: 'No fields provided for update.' });
    }

    const parsedMaterials = body.materials ? JSON.parse(body.materials) : [];

    const imagePaths = imageFiles.map(file => {
        const ext = file.mimetype.split('/')[1];
        return `/uploads/${file.filename}.${ext}`;
    });

    try {
        await DB.UpdateProject(project_id, updates, parsedMaterials, imagePaths);
        res.status(200).json({ message: 'Project and related data successfully updated.' });
    } catch (err) {
        console.error("Error updating project:", err);
        res.status(500).json({ error: 'Server error while updating project.' });
    }
});

project.get('/:projectId', async (req, res) => {
    const { projectId } = req.params;

    try {
        const data = await DB.GetProjectDetails(projectId);
        res.status(200).json(data);
    } catch (err) {
        if (err.message === 'Project not found') {
            res.status(404).json({ error: 'Project not found' });
        } else {
            res.status(500).json({ error: 'Server error fetching project details' });
        }
    }
});

project.post('/search', async (req, res) => {
    const { searchText, category, difficulty, materialName } = req.body;

    try {
        const projects = await DB.SearchProjects({ searchText, category, difficulty, materialName });
        res.status(200).json({ projects });
    } catch (err) {
        console.error('Error searching projects:', err);
        res.status(500).json({ error: 'Server error while searching projects.' });
    }
});

project.delete('/:projectId', async (req, res) => {
    const { projectId } = req.params;

    try {
        await DB.DeleteProject(projectId);
        res.status(200).json({ message: 'Project successfully deleted.' });
    } catch (err) {
        console.error("Error deleting project:", err);
        res.status(500).json({ error: err.message || 'Failed to delete project.' });
    }
});

module.exports = project;