const mysql = require('mysql2');


const conn = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE,
})

conn.connect((err) => {
    if (err) {
        console.log("ERROR: " + err.message);
        return;
    }
    console.log('Connection established');
})

let dataPool = {}

dataPool.GetUserByUserName = (username) => {
    return new Promise((resolve, reject) => {
        conn.query('SELECT * FROM user WHERE username = ?', [username], (err, res) => {
            if (err) return reject(err);
            return resolve(res);
        });
    });
}

dataPool.CreateUser = (username, hashedPassword, email, filePath) => {
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO user (username, password_hash, email, profile_picture) VALUES (?, ?, ?, ?)';
        conn.query(query, [username, hashedPassword, email, filePath], (err, res) => {
            if (err) return reject(err);
            return resolve(res);
        });
    });
}

module.exports = dataPool;

