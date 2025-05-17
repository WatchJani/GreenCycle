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


dataPool.AddMaterial = (material) => {
    const {
        category,
        description,
        is_ecologically_bool,
        is_sensitive_bool,
        unit,
        name,
        file_name
    } = material;

    return new Promise((resolve, reject) => {
        const query = `
            INSERT INTO material (
                category,
                description,
                is_ecologically,
                is_sensitive,
                unit,
                name,
                icon
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            category,
            description,
            is_ecologically_bool,
            is_sensitive_bool,
            unit,
            name,
            file_name
        ];

        conn.query(query, values, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

dataPool.DeleteMaterial = (material_id) => {
    return new Promise((resolve, reject) => {
        const query = 'DELETE FROM material WHERE material_id = ?';

        conn.query(query, [material_id], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

dataPool.EditMaterial = (material_id, updates) => {
    const column = [];
    const value = [];

    for (const key in updates) {
        column.push(`${key} = ?`);
        value.push(updates[key]);
    }

    if (column.length === 0) {
        return Promise.resolve();
    }

    value.push(material_id);

    const sql = `
        UPDATE material SET
        ${column.join(', ')}
        WHERE material_id = ?
    `;

    return new Promise((resolve, reject) => {
        conn.query(sql, value, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};


dataPool.SearchMaterials = ({ name, is_ecologically, is_sensitive, unit }) => {
    return new Promise((resolve, reject) => {
        let query = 'SELECT * FROM material WHERE 1=1';
        const values = [];

        if (name) {
            query += ' AND name LIKE ?';
            values.push(`%${name}%`);
        }

        if (is_ecologically !== undefined) {
            query += ' AND is_ecologically = ?';
            values.push(is_ecologically);
        }

        if (is_sensitive !== undefined) {
            query += ' AND is_sensitive = ?';
            values.push(is_sensitive);
        }

        if (unit) {
            query += ' AND unit = ?';
            values.push(unit);
        }

        conn.query(query, values, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
};


dataPool.AssignRoleToUser = (user_id, role_id) => {
    return new Promise((resolve, reject) => {
        const checkQuery = `
            SELECT * FROM role_user
            WHERE user_id = ? AND role_id = ?
        `;

        conn.query(checkQuery, [user_id, role_id], (err, results) => {
            if (err) return reject({ status: 500, message: 'Error checking role existence', err });

            if (results.length > 0) {
                return reject({ status: 409, message: 'This user already has that role.' });
            }

            const insertQuery = `
                INSERT INTO role_user (role_id, user_id)
                VALUES (?, ?)
            `;

            conn.query(insertQuery, [role_id, user_id], (err, result) => {
                if (err) return reject({ status: 500, message: 'Error assigning role', err });
                resolve(result);
            });
        });
    });
}

dataPool.CreateProject = (project, materials, imagePaths) => {
    return new Promise((resolve, reject) => {
        conn.beginTransaction((err) => {
            if (err) return reject(err);

            const queryProject = `
                INSERT INTO project 
                    (title, description, category, difficulty, time_requied, is_published, instruction, thumbnail, create_at, user_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
                project.title,
                project.description,
                project.category,
                project.difficulty,
                project.time_required,
                project.is_published,
                project.instruction,
                project.thumbnail,
                new Date(),
                project.user
            ];

            conn.query(queryProject, values, (err, result) => {
                if (err) return conn.rollback(() => reject(err));
                const projectId = result.insertId;

                const insertMaterials = () => {
                    if (!materials || materials.length === 0) return Promise.resolve();
                    const materialData = materials.map(item => [projectId, item.id, item.quantity]);
                    const queryMaterial = `
                        INSERT INTO material_project (project_id, material_id, quantity)
                        VALUES ?
                    `;
                    return new Promise((resolveMat, rejectMat) => {
                        conn.query(queryMaterial, [materialData], (err) => {
                            if (err) return rejectMat(err);
                            resolveMat();
                        });
                    });
                };

                const insertImages = () => {
                    if (!imagePaths || imagePaths.length === 0) return Promise.resolve();
                    const imageData = imagePaths.map(path => [projectId, path]);
                    const queryImages = `
                        INSERT INTO project_images (project_id, image_path)
                        VALUES ?
                    `;
                    return new Promise((resolveImg, rejectImg) => {
                        conn.query(queryImages, [imageData], (err) => {
                            if (err) return rejectImg(err);
                            resolveImg();
                        });
                    });
                };

                Promise.all([insertMaterials(), insertImages()])
                    .then(() => {
                        conn.commit((err) => {
                            if (err) return conn.rollback(() => reject(err));
                            resolve(projectId);
                        });
                    })
                    .catch((err) => conn.rollback(() => reject(err)));
            });
        });
    });
};

dataPool.UpdateProject = (projectId, updates, materials, imagePaths) => {
    return new Promise((resolve, reject) => {
        conn.beginTransaction(err => {
            if (err) return reject(err);

            function updateProject() {
                if (!updates || Object.keys(updates).length === 0) return Promise.resolve();

                const columns = Object.keys(updates).map(key => `${key} = ?`).join(', ');
                const values = Object.values(updates);
                const query = `UPDATE project SET ${columns} WHERE project_id = ?`;

                return new Promise((resolveUpdate, rejectUpdate) => {
                    conn.query(query, [...values, projectId], (err) => {
                        if (err) return rejectUpdate(err);
                        resolveUpdate();
                    });
                });
            }

            function updateMaterials() {
                if (!materials) return Promise.resolve();

                return new Promise((resolveMat, rejectMat) => {
                    conn.query('DELETE FROM material_project WHERE project_id = ?', [projectId], err => {
                        if (err) return rejectMat(err);

                        if (materials.length === 0) return resolveMat();

                        const matData = materials.map(m => [projectId, m.id, m.quantity]);

                        const insertQuery = 'INSERT INTO material_project (project_id, material_id, quantity) VALUES ?';
                        conn.query(insertQuery, [matData], err => {
                            if (err) return rejectMat(err);
                            resolveMat();
                        });
                    });
                });
            }

            function updateImages() {
                if (!imagePaths) return Promise.resolve();

                return new Promise((resolveImg, rejectImg) => {
                    conn.query('DELETE FROM project_images WHERE project_id = ?', [projectId], err => {
                        if (err) return rejectImg(err);

                        if (imagePaths.length === 0) return resolveImg();

                        const imgData = imagePaths.map(path => [projectId, path]);

                        const insertQuery = 'INSERT INTO project_images (project_id, image_path) VALUES ?';
                        conn.query(insertQuery, [imgData], err => {
                            if (err) return rejectImg(err);
                            resolveImg();
                        });
                    });
                });
            }

            Promise.all([
                updateProject(),
                updateMaterials(),
                updateImages()
            ])
                .then(() => {
                    conn.commit(err => {
                        if (err) return conn.rollback(() => reject(err));
                        resolve();
                    });
                })
                .catch(err => {
                    conn.rollback(() => reject(err));
                });
        });
    });
};


dataPool.DeleteProject = (projectId) => {
    return new Promise((resolve, reject) => {
        const query = 'DELETE FROM project WHERE project_id = ?';
        conn.query(query, [projectId], (err, result) => {
            if (err) return reject(err);
            if (result.affectedRows === 0) {
                return reject(new Error('Project not found'));
            }
            resolve();
        });
    });
};

dataPool.RemoveUserRole = (user_id, role_id) => {
    return new Promise((resolve, reject) => {
        const deleteQuery = `
            DELETE FROM role_user
            WHERE user_id = ? AND role_id = ?
        `;

        conn.query(deleteQuery, [user_id, role_id], (err, result) => {
            if (err) return reject({ status: 500, message: 'Error removing role', err });

            if (result.affectedRows === 0) {
                return reject({ status: 404, message: 'Role not found for this user.' });
            }

            resolve({ message: 'Role removed successfully.' });
        });
    });
}

dataPool.GetUserRolesByUserId = (userId) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT r.name 
            FROM role_user ru
            JOIN role r ON ru.role_id = r.role_id
            WHERE ru.user_id = ?
        `;

        conn.query(query, [userId], (err, results) => {
            if (err) return reject(err);
            resolve(results.map(row => row.name));
        });
    });
}


dataPool.GetUsersWithPermissions = () => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                u.user_id,
                u.username,
                r.name AS role_name,
                r.description AS role_description
            FROM user u
            JOIN role_user ru ON u.user_id = ru.user_id
            JOIN role r ON ru.role_id = r.role_id
            ORDER BY u.user_id;
        `;

        conn.query(query, (err, results) => {
            if (err) return reject(err);

            const usersMap = new Map();

            results.forEach(row => {
                if (!usersMap.has(row.user_id)) {
                    usersMap.set(row.user_id, {
                        user_id: row.user_id,
                        username: row.username,
                        roles: []
                    });
                }

                usersMap.get(row.user_id).roles.push({
                    name: row.role_name,
                    description: row.role_description
                });
            });

            resolve(Array.from(usersMap.values()));
        });
    });
};

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

