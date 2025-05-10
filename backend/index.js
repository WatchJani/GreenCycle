const express = require('express')
require('dotenv').config()
const app = express()
const cors = require("cors")
const path = require('path')
const port = process.env.PORT || 5009

// import local files
// const novice = require('./routes/novice')
// const users = require('./routes/users')
// const upload = require('./routes/upload')


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
    origin: 'http://localhost:5009',
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
// app.use('/user', users)
// app.use('/comment', upload)
// app.use('/material', upload)
// app.use('/report', upload)


// start the express server
app.listen(port, () => console.log(`Example app listening on port ${port}!`))

