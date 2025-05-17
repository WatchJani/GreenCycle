const express = require("express")
const comment = express.Router()
const DB = require('../db/dbConn.js')

comment.post('/', async (req, res) => {
    const { content, project_id } = req.body;

    if (!req.session.user) {
        return res.status(401).json({ error: 'You must be logged in to comment.' });
    }

    if (!content || !project_id) {
        return res.status(400).json({ error: 'Content and project ID are required.' });
    }

    try {
        const commentId = await DB.AddComment({
            content,
            user_id: req.session.user.user_id,
            project_id,
        });

        res.status(201).json({ message: 'Comment added successfully.', commentId });
    } catch (err) {
        console.error('Error adding comment:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

comment.put('/:comment_id', async (req, res) => {
    const { comment_id } = req.params;
    const { content } = req.body;
   
    if (!req.session.user) {
        return res.status(401).json({ error: 'You must be logged in to update comments.' });
    }

    if (!content) {
        return res.status(400).json({ error: 'Content is required.' });
    }

    try {
        await DB.UpdateComment(comment_id, req.session.user.user_id, content);
        res.status(200).json({ message: 'Comment updated successfully.' });
    } catch (err) {
        console.error('Error updating comment:', err.message);
        res.status(404).json({ error: err.message });
    }
});

module.exports = comment;
