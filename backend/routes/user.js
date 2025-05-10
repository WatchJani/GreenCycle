const express = require("express")
const users = express.Router()
const DB = require('../db/dbConn.js')
const multer = require('multer')
const bcrypt = require('bcrypt')

let upload_dest = multer({ dest: 'uploads/' })

users.post('/login', async (req, res) => {
    var username = req.body.username;
    var password = req.body.password;
    if (username && password) {
        try {
            let queryResult = await DB.AuthUser(username);

            if (queryResult.length > 0) {
                if (password === queryResult[0].user_password) {
                    console.log(queryResult)
                    console.log("LOGIN OK");
                    req.session.logged_in = true;
                    res.json({ success: true, message: "LOGIN OK" });
                    res.status(200)
                }
                else {
                    console.log("INCORRECT PASSWORD");
                    res.json({ success: false, message: "INCORRECT PASSWORD" });
                    res.status(200)
                }
            } else {
                console.log("USER NOT REGISTRED");
                res.json({ success: false, message: "USER NOT REGISTRED" });
                res.status(200)
            }
        }
        catch (err) {
            console.log(err)
            res.status(404)
        }
    }
    else {
        console.log("Please enter Username and Password!")
        res.json({ success: false, message: "Please enter Username and Password!" });
        res.status(204)
    }
    res.end();
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

users.get('/list', async (req, res, next) => {
    try {
        var queryResult = await DB.allUsers();
        res.json(queryResult)
    }
    catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})


users.post('/register', upload_dest.single('file'), async (req, res) => {
    try {
        const { username, password, email } = req.body;
        const file = req.file;

        if (!username || !password || !email || !file) {
            return res.status(400).json({ error: 'All fields are required, including the file' });
        }

        const existingUsers = await DB.RegisterUser(username);
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

