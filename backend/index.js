const express = require('express')
require('dotenv').config()
const app = express()
const cors = require("cors")
const path = require('path')
const port = process.env.PORT || 12345

// import local files
const user = require('./routes/user')
const role = require('./routes/role')
const material = require('./routes/material')
const project = require('./routes/project')
const report = require('./routes/report')
const comment = require('./routes/comment')

const session = require('express-session')

app.set('trust proxy', 1) // trust first proxy

//Some configurations
app.use(express.urlencoded({ extended: true }));

// configurations
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: 'http://88.200.63.148:8081',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));

app.use(session({
    secret: 'some secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
    }
}));


app.use('/api/v1/user', user)
app.use('/api/v1/role', role)
app.use('/api/v1/material', material)
app.use('/api/v1/project', project)
app.use('/api/v1/report', report)
app.use('/api/v1/comment', comment)

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.static(path.join(__dirname, 'build')));

app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))