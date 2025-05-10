const express = require("express")
const users = express.Router()
const DB = require('../db/dbConn.js')
const multer = require('multer')
const bcrypt = require('bcrypt')

let upload_dest = multer({ dest: 'uploads/' })

users.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        console.log("Please enter Username and Password!");
        return res.status(400).json({ success: false, message: "Please enter Username and Password!" });
    }

    try {
        const queryResult = await DB.GetUserByUserName(username);

        if (queryResult.length === 0) {
            console.log("USER NOT REGISTERED");
            return res.status(404).json({ success: false, message: "User not registered" });
        }

        const user = queryResult[0];

        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (passwordMatch) {
            console.log("LOGIN OK");
            req.session.logged_in = true;
            return res.status(200).json({ success: true, message: "Login successful" });
        } else {
            console.log("INCORRECT PASSWORD");
            return res.status(401).json({ success: false, message: "Incorrect password" });
        }

    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});

users.get('/roles', async (req, res) => {
    try {
        const users = await DB.GetUsersWithPermissions();
        res.status(200).json(users);
    } catch (err) {
        console.error("Error fetching users with permissions:", err);
        res.status(500).json({ error: 'Server error while fetching users and permissions.' });
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

