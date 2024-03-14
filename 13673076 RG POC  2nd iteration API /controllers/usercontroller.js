const conn = require('./../utils/dbconn');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');

exports.getUserDetails = (req, res) => {

    const { userid } = req.params;
    const getuserSQL = `SELECT user.first_name, user.last_name,
        user_type.role, user.user_id
        FROM user
        INNER JOIN user_type ON
        user.user_type_id =
        user_type.user_type_id
        WHERE user.user_id = ?`;

    conn.query(getuserSQL,[userid], (err, rows) => {
        if (err) {
            res.status(500);
            res.json({
                status: 'failure',
                message: err
            });
        } else {
            if (rows.length > 0) {
                res.status(200);
                res.json({
                    status: 'success',
                    message: `${rows.length} records retrieved`,
                    result: rows
                });
            } else {
                res.status(404);
                res.json({
                    status: 'failure',
                    message: `Invalid ID ${id}`
                });
            }
        }
    });
};

exports.postAPILogin = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ error: errors.array()[0].msg });
    }

    const { username, userpass } = req.body;
    const checkuserSQL = `SELECT * FROM user WHERE user.user_name = ?`;

    conn.query(checkuserSQL, username, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
        }

        const numrows = rows.length;
        if (numrows === 0) {
            return res.status(422).json({ error: 'User not found.' });
        }

        const user = rows[0];
        bcrypt.compare(userpass, user.user_password, (err, response) => {
            if (err) {
                return res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
            }
            if (response) {
                // Respond with success message or appropriate data
                res.status(200).json({ message: 'Login successful', user_id: user.user_id });
            } else {
                return res.status(422).json({ error: 'Incorrect password - please try again!' });
            }
        });
    });
};



exports.postSignup = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ error: errors.array()[0].msg });
    }

    const { firstname, lastname, username, userpass, user_type_id } = req.body;
    const hash = await bcrypt.hash(userpass, 12);

    // Check if the username already exists in the database
    conn.query('SELECT COUNT(*) AS count FROM user WHERE user_name = ?', [username], (err, rows) => {
        if (err) {
            // Handle query error
            console.error(err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        const count = rows[0].count;
        if (count > 0) {
            // Username already exists, send error message to the client
            return res.status(422).json({ error: 'Username already exists!' });
        }

        // Username is unique, proceed with insertion
        const insertSQL = 'INSERT INTO user (first_name, last_name, user_name, user_password, user_type_id) VALUES (?, ?, ?, ?, 1)';
        const vals = [firstname, lastname, username, hash, user_type_id];

        conn.query(insertSQL, vals, (err, rows) => {
            if (err) {
                // Handle insertion error
                console.error(err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            res.status(201).json({ success: true, message: 'User created successfully' });
        });
    });
};

exports.selectUserDetails = (req, res) => {
    const { userid } = req.params;
        const selectSQL = `SELECT * FROM user WHERE user_id = ?`;

        conn.query(selectSQL, [userid], (err, rows) => {
            if (err) {
                console.error('Error fetching user details:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            // Check if any rows were returned
            if (rows.length === 0) {
                // Handle case where no data was found for the given user ID
                res.status(404).json({ error: 'User details not found' });
                return;
            }

            res.json({ summary: rows, error: null, success: null });
        });
    }


    exports.updateUserDetails = async (req, res) => {
        const { userid } = req.params;
        const { firstname, lastname, username, userpass } = req.body;
    
        try {
            // Check if the provided username already exists in the database (excluding the current user)
            conn.query('SELECT COUNT(*) AS count FROM user WHERE user_name = ? AND user_id != ?', [username, userid], async (err, rows) => {
                if (err) {
                    console.error('Error checking username existence:', err);
                    return res.status(500).json({ error: 'Internal Server Error' });
                }
    
                const count = rows[0].count;
                if (count > 0) {
                    return res.status(422).json({ error: 'Username already exists!', success: null });
                }
    
                // Hash the new password if provided
                let hash;
                if (userpass) {
                    hash = await bcrypt.hash(userpass, 12);
                }
    
                // Update user details in the database
                const updateSQL = `UPDATE user SET first_name = ?, last_name = ?, user_name = ?, ${userpass ? 'user_password = ?' : ''} WHERE user_id = ?`;
                const updateParams = userpass ? [firstname, lastname, username, hash, userid] : [firstname, lastname, username, userid];
    
                conn.query(updateSQL, updateParams, (err, result) => {
                    if (err) {
                        console.error('Error updating user details:', err);
                        return res.status(500).json({ error: 'Internal Server Error' });
                    }
    
                    if (result.affectedRows === 0) {
                        return res.status(404).json({ error: 'User not found', success: null });
                    }
    
                    return res.json({ success: 'User information updated successfully!', error: null });
                });
            });
        } catch (error) {
            console.error('An unexpected error occurred:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }; 