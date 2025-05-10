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

const session = require('express-session')

app.set('trust proxy', 1) // trust first proxy
app.use(session({
    secret: 'some secret',
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false }
}))

//Some configurations
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: 'http://localhost:12345',
    methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD', 'DELETE'],
    credentials: true
}))

// configurations
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    methods: ["GET", "POST"],
}))


// actual routes
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"))
})

// app.use('/project', novice)
app.use('/user', user)
app.use('/role', role)
app.use('/material', material)


// start the express server
app.listen(port, () => console.log(`Example app listening on port ${port}!`))

