const express = require("express")
const users = express.Router()
const DB = require('../db/dbConn.js')
const multer = require('multer')
const bcrypt = require('bcrypt')

let upload_dest = multer({ dest: 'uploads/' })

users.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Please enter Username and Password!" });
    }

    try {
        const queryResult = await DB.GetUserByUserName(username);

        if (queryResult.length === 0) {
            return res.status(404).json({ success: false, message: "User not registered" });
        }

        const user = queryResult[0];
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({ success: false, message: "Incorrect password" });
        }

        // Dohvati role korisnika iz baze
        const roles = await DB.GetUserRolesByUserId(user.user_id); // npr: ['admin', 'editor']

        // Snimi u sesiju
        req.session.logged_in = true;
        req.session.user = {
            user_id: user.user_id,
            username: user.username,
            roles: roles // niz rola
        };

        return res.status(200).json({ success: true, message: "Login successful" });

    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});

users.get('/session', async (req, res, next) => {
    try {
        console.log("session data: ")
        console.log(req.session)
        res.json(req.session);
    }
    catch (err) {
        console.log(err)
        res.sendStatus(500)
        next()
    }
})

users.get('/logout', async (req, res, next) => {
    try {
        req.session.destroy(function (err) {
            res.json({ status: { success: true, msg: err } })
        })

    }
    catch (err) {
        console.log(err)
        res.json({ status: { success: false, msg: err } })
        res.sendStatus(500)
        next()
    }
})

users.post('/register', upload_dest.single('file'), async (req, res) => {
    try {
        const { username, password, email } = req.body;
        const file = req.file;

        if (!username || !password || !email || !file) {
            return res.status(400).json({ error: 'All fields are required, including the file' });
        }

        const existingUsers = await DB.GetUserByUserName(username);
        if (existingUsers.length > 0) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await DB.CreateUser(username, hashedPassword, email, file.path);

        return res.status(201).json({
            message: 'Registration successful',
            user: { username, email }
        });

    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ error: 'An error occurred on the server' });
    }
});


module.exports = users

