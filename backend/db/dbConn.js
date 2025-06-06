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

dataPool.GetCommentsByProjectId = (projectId) => {
    return new Promise((resolve, reject) => {
        const query = `
      SELECT c.comment_id, c.content, c.created_at, c.user_id, c.project_id,
             u.username, u.profile_picture
      FROM comment c
      JOIN user u ON c.user_id = u.user_id
      WHERE c.project_id = ?
      ORDER BY c.created_at DESC
    `;

        conn.query(query, [projectId], (err, res) => {
            if (err) return reject(err);
            return resolve(res);
        });
    });
};

dataPool.GetAllMaterials = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT material_id, category, description, is_ecologically, is_sensitive, unit, name, icon
      FROM material ORDER BY material_id DESC
    `;
    conn.query(query, (err, res) => {
      if (err) return reject(err);
      return resolve(res);
    });
  });
};

dataPool.UpdateReportStatus = (report_id, status) => {
    return new Promise((resolve, reject) => {
        const query = `UPDATE report SET status = ? WHERE report_id = ?`;

        conn.query(query, [status, report_id], (err, result) => {
            if (err) return reject(err);

            if (result.affectedRows === 0) {
                return reject(new Error('Report not found'));
            }

            resolve();
        });
    });
};

dataPool.GetPendingReports = () => {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM report WHERE status = 'pending'`;

        conn.query(query, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
};

dataPool.AddComment = ({ content, user_id, project_id = null }) => {
    return new Promise((resolve, reject) => {
        const query = `
            INSERT INTO comment (content, created_at, user_id, project_id)
            VALUES (?, NOW(), ?, ?)
        `;
        const values = [content, user_id, project_id];

        conn.query(query, values, (err, result) => {
            if (err) return reject(err);
            resolve(result.insertId);
        });
    });
};

dataPool.UpdateComment = (comment_id, user_id, content) => {
    return new Promise((resolve, reject) => {
        const query = `
            UPDATE comment
            SET content = ?
            WHERE comment_id = ? AND user_id = ?
        `;

        conn.query(query, [content, comment_id, user_id], (err, result) => {
            if (err) return reject(err);
            if (result.affectedRows === 0) {
                return reject(new Error('Comment not found or user not authorized.'));
            }
            resolve();
        });
    });
};

dataPool.DeleteComment = (comment_id, user_id, user_role) => {
    return new Promise((resolve, reject) => {
        let query = 'DELETE FROM comment WHERE comment_id = ?';
        const values = [comment_id];

        if (user_role !== 'admin' && user_role !== 'moderator') {
            query += ' AND user_id = ?';
            values.push(user_id);
        }

        conn.query(query, values, (err, result) => {
            if (err) return reject(err);
            if (result.affectedRows === 0) {
                return reject(new Error('Comment not found or unauthorized.'));
            }
            resolve();
        });
    });
};


dataPool.GetProjectDetails = (projectId) => {
    return new Promise((resolve, reject) => {
        const projectQuery = 'SELECT * FROM project WHERE project_id = ?';
        const materialsQuery = `
            SELECT mp.material_id, mp.quantity, m.name, m.category, m.unit, m.description, m.is_ecologically, m.is_sensitive, m.icon
            FROM material_project mp
            JOIN material m ON mp.material_id = m.material_id
            WHERE mp.project_id = ?
        `;
        const imagesQuery = 'SELECT image_path FROM project_images WHERE project_id = ?';

        conn.query(projectQuery, [projectId], (err, projectRows) => {
            if (err) return reject(err);
            if (projectRows.length === 0) return reject(new Error('Project not found'));

            const project = projectRows[0];

            conn.query(materialsQuery, [projectId], (err, materialsRows) => {
                if (err) return reject(err);

                conn.query(imagesQuery, [projectId], (err, imagesRows) => {
                    if (err) return reject(err);

                    resolve({
                        project,
                        materials: materialsRows,
                        images: imagesRows.map(row => row.image_path),
                    });
                });
            });
        });
    });
};


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

dataPool.AddReport = ({ type, reason, user_id, project_id }) => {
    return new Promise((resolve, reject) => {
        const query = `
            INSERT INTO report 
            (type, reason, date_reported, user_id, project_id, status) 
            VALUES (?, ?, NOW(), ?, ?, 'pending')
        `;

        const values = [type, reason, user_id, project_id];

        conn.query(query, values, (err, result) => {
            if (err) return reject(err);
            resolve(result.insertId);
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

dataPool.SearchProjects = ({
    searchText,
    category,
    difficulty,
    materialName
}) => {
    return new Promise((resolve, reject) => {
        let query = `
            SELECT DISTINCT p.*
            FROM project p
            LEFT JOIN material_project mp ON p.project_id = mp.project_id
            LEFT JOIN material m ON mp.material_id = m.material_id
            WHERE 1=1
        `;

        const values = [];

        if (searchText) {
            query += ` AND (
                p.title LIKE ? OR 
                p.description LIKE ? OR 
                p.instruction LIKE ?
            )`;
            const likeSearch = `%${searchText}%`;
            values.push(likeSearch, likeSearch, likeSearch);
        }

        if (category) {
            query += ' AND p.category = ?';
            values.push(category);
        }

        if (difficulty) {
            query += ' AND p.difficulty = ?';
            values.push(difficulty);
        }

        if (materialName) {
            query += ' AND m.name LIKE ?';
            values.push(`%${materialName}%`);
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

dataPool.GetUserById = (userId) => {
    return new Promise((resolve, reject) => {
        const userQuery = `
            SELECT user_id, username, email, profile_picture, points
            FROM user
            WHERE user_id = ?
        `;

        const rolesQuery = `
            SELECT r.role_id, r.name, r.description
            FROM role_user ru
            JOIN role r ON ru.role_id = r.role_id
            WHERE ru.user_id = ?
        `;

        conn.query(userQuery, [userId], (err, userResults) => {
            if (err) return reject(err);
            if (userResults.length === 0) return resolve(null); // user not found

            const user = userResults[0];

            conn.query(rolesQuery, [userId], (err, roleResults) => {
                if (err) return reject(err);

                user.roles = roleResults;
                resolve(user);
            });
        });
    });
};


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

