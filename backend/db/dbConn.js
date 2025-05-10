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
        conn.beginTransaction((err) => {
            if (err) return reject(err);

            //insert user in user
            const insertUserQuery = 'INSERT INTO user (username, password_hash, email, profile_picture) VALUES (?, ?, ?, ?)';
            conn.query(insertUserQuery, [username, hashedPassword, email, filePath], (err, result) => {
                if (err) {
                    return conn.rollback(() => reject(err));
                }

                const userId = result.insertId;
                const roleId = 3; // default "user"

                // 2. insert in role_user
                const insertRoleUserQuery = 'INSERT INTO role_user (role_id, user_id) VALUES (?, ?)';
                conn.query(insertRoleUserQuery, [roleId, userId], (err, result2) => {
                    if (err) {
                        return conn.rollback(() => reject(err));
                    }

                    // 3. Commit transakcije
                    conn.commit((err) => {
                        if (err) {
                            return conn.rollback(() => reject(err));
                        }
                        return resolve({ userId, message: 'User and role inserted successfully' });
                    });
                });
            });
        });
    });
}

module.exports = dataPool;

