//const conn = require('../utils/dbconn');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const axios = require('axios');

exports.getSnapshot = async (req, res) => {
    var userinfo = {};
    const { isloggedin, userid } = req.session;
    console.log(`User data from session: ${isloggedin} ${userid}`);

    try {
        if (isloggedin) {

            const userEndpoint = `http://localhost:3002/${userid}/details`;
            const userResponse = await axios.get(userEndpoint);
            const userData = userResponse.data.result;
            console.log(userData);

            const userId = userData[0].user_id;
            const username = userData[0].first_name;
            const userrole = userData[0].role;

            const session = req.session;
            session.name = username;
            session.role = userrole;
            session.id = userId;
            console.log(session);

            userinfo = { name: username, role: userrole, id: userId };
            console.log(userinfo);

            const snapshotEndpoint = `http://localhost:3002/user/${userid}/snapshot`;
            const snapshotResponse = await axios.get(snapshotEndpoint);
            const snapshotData = snapshotResponse.data.result;
            console.log(snapshotData);
            res.render('index', { summary: snapshotData, loggedin: isloggedin, user: userinfo });
        } else {
            res.render('index', { loggedin: isloggedin });
        }
    } catch (error) {
        console.log(`Error: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

exports.getAddNewSnapshot = (req, res) => {
    res.render('addemotion');
};

exports.postNewSnapshot = (req, res) => {
    const { userid } = req.params;
    let selectedOptions = req.body.listTrigger;
    let commaDelimitedString;

    // Check if selectedOptions is an array
    if (Array.isArray(selectedOptions)) {
        commaDelimitedString = selectedOptions.join(', ');
    } else {
        commaDelimitedString = selectedOptions; // Assuming selectedOptions is a single value
    }

    const { enjoyment_level, sadness_level, anger_level, contempt_level, disgust_level, fear_level, surprise_level, contextual_trigger, new_date } = req.body;

    const vals = [enjoyment_level, sadness_level, anger_level, contempt_level, disgust_level, fear_level, surprise_level, commaDelimitedString, contextual_trigger, new_date, userid];

    const endpoint = `http://localhost:3002/user/${userid}/new`;

    axios
        .post(endpoint, vals)
        .then((response) => {
            const data = response.data;
            console.log(data);
            res.redirect('/');
        })
        .catch((error) => {
            console.log(`Error making API request: ${error}`);
        });
}

//needs to be updated for an axios request with asymc/await
/*
exports.selectSnapshot = (req, res) => {

    const snapshotId = req.params.id;

    const selectSQL = `SELECT * FROM emotion_snapshot WHERE emotion_snapshot_id = ?`;

    conn.query(selectSQL, [snapshotId], (err, rows) => {
        if (err) {
            console.error('Error fetching snapshot data:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        // Check if any rows were returned
        if (rows.length === 0) {
            // Handle case where no data was found for the given snapshotId
            res.status(404).send('Snapshot not found');
            return;
        }

        res.render('editemotion', { summary: rows });
    });
}; */


exports.updateSnapshot = (req, res) => {
    const summary_id = req.params.id;
    const selectedOptions = req.body.listTrigger;
    let commaDelimitedString;

    // Check if selectedOptions is an array
    if (Array.isArray(selectedOptions)) {
        commaDelimitedString = selectedOptions.join(', ');
    } else {
        commaDelimitedString = selectedOptions; // Assuming selectedOptions is a single value
    }

    const { enjoyment_level, sadness_level, anger_level, contempt_level, disgust_level, fear_level, surprise_level, contextual_trigger, new_date } = req.body;
    const vals = [enjoyment_level, sadness_level, anger_level, contempt_level, disgust_level, fear_level, surprise_level, commaDelimitedString, contextual_trigger, new_date, summary_id];

    const endpoint = `http://localhost:3002/user/editput/${summary_id}`;

    axios
        .put(endpoint, vals)
        .then((response) => {
            console.log(response.data);
            res.redirect('/');
        })
        .catch((error) => {
            console.log(`Error making API request: ${error}`);
        });
}


exports.deleteSnapshot = (req, res) => {

    const summary_id = req.params.id;

    const endpoint = `http://localhost:3002/snapshot/delete/${summary_id}`;
    axios
        .delete(endpoint)
        .then((response) => {
            console.log(response.data);
            res.redirect('/');
        })
        .catch((error) => {
            console.log(`Error making API request: ${error}`);
        });
};

// Needs to be updated to axious promise with async/await
/*
exports.getSummaryChart = (req, res) => {
    const { isloggedin, userid } = req.session;

    // Function to fetch summary data
    const fetchSummaryData = (query, params) => {
        return new Promise((resolve, reject) => {
            conn.query(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }; 

    // Check if the user is logged in
    if (isloggedin) {
        // Check if filters are provided
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        if (startDate && endDate) {
            // Filters are provided, fetch filtered data
            const selectSQL = `SELECT * FROM emotion_snapshot WHERE user_id = ? AND timestamp BETWEEN ? AND ?`;
            const params = [userid, startDate, endDate];

            fetchSummaryData(selectSQL, params)
                .then(rows => {
                    // Process the retrieved rows (data) for filters
                    const { counts, snapshotData } = processSummaryData(rows);
                    // Render the view with the processed data for filters
                    res.render('summarychart', { snapshotData, counts });
                })
                .catch(err => {
                    console.error('Error fetching filtered summary data:', err);
                    res.status(500).send('Internal Server Error');
                });
        } else {
            // No filters provided, fetch all data
            const selectAllSQL = `SELECT * FROM emotion_snapshot WHERE user_id = ?`;
            const paramsAll = [userid];

            fetchSummaryData(selectAllSQL, paramsAll)
                .then(rows => {
                    // Process the retrieved rows (data) for all
                    const { counts, snapshotData } = processSummaryData(rows);
                    // Render the view with the processed data for all
                    res.render('summarychart', { snapshotData, counts });
                })
                .catch(err => {
                    console.error('Error fetching all summary data:', err);
                    res.status(500).send('Internal Server Error');
                });
        }
    } else {
        // If the user is not logged in, send unauthorized response
        res.status(401).send('Unauthorized');
    }
};

// Function to process the retrieved rows (data) and calculate counts and store emotion levels for each snapshot date
const processSummaryData = (rows) => {
    var countsocial = 0;
    var countphysical = 0;
    let countfamily = 0;
    var countwork = 0;
    var countsleep = 0;
    var countweather = 0;
    const snapshotData = {};

    rows.forEach(row => {
        const { timestamp, enjoyment_level, sadness_level, anger_level, contempt_level, disgust_level, fear_level, surprise_level } = row;

        const contextualTriggers = row.list_contextual_trigger ? row.list_contextual_trigger.split(',') : [];
        contextualTriggers.forEach(trigger => {
            switch (trigger.trim()) {
                case 'Social Interaction':
                    countsocial++;
                    break;
                case 'Physical Activity':
                    countphysical++;
                    break;
                case 'Family':
                    countfamily++;
                    break;
                case 'Work':
                    countwork++;
                    break;
                case 'Sleep':
                    countsleep++;
                    break;
                case 'Weather':
                    countweather++;
                    break;
                default:
                    break;
            }
        });

        if (!snapshotData[timestamp]) {
            snapshotData[timestamp] = {
                enjoyment: [],
                sadness: [],
                anger: [],
                contempt: [],
                disgust: [],
                fear: [],
                surprise: []
            };
        }

        snapshotData[timestamp].enjoyment.push(enjoyment_level);
        snapshotData[timestamp].sadness.push(sadness_level);
        snapshotData[timestamp].anger.push(anger_level);
        snapshotData[timestamp].contempt.push(contempt_level);
        snapshotData[timestamp].disgust.push(disgust_level);
        snapshotData[timestamp].fear.push(fear_level);
        snapshotData[timestamp].surprise.push(surprise_level);
    });

    const counts = [countsocial, countphysical, countfamily, countwork, countsleep, countweather];
    return { counts, snapshotData };
}; */

exports.getLogin = (req, res) => {
    res.render('login', { error: null, success: null });
};

exports.getLogout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
};

exports.postLogin = async (req, res) => {
    const { username, userpass } = req.body;
    const vals = { username, userpass };
    const endpoint = `http://localhost:3002/login`;

    try {
        const response = await axios.post(endpoint, vals, { validateStatus: status => status < 500 });
        const status = response.status;

        if (status === 200) {
            const userData = response.data;
            console.log(userData);

            const session = req.session;
            session.isloggedin = true;
            session.username = userData.user_name;
            session.userid = userData.user_id;
            session.userpass = userData.user_pass;

            // Redirect to the appropriate page after successful login
            res.redirect('/');
        } else {
            console.log('API request unsuccessful:', response.data);
            res.redirect('/login');
        }
    } catch (error) {
        console.log(`Error making API request: ${error}`);
        // Handle error when making the API request
        res.redirect('/login');
    }
};




exports.getSignup = (req, res) => {
    res.render('signup', { error: null, success: null });
};

/* Needs to be updated with axious promise with async/await
exports.selectUserDetails = (req, res) => {
    const { isloggedin, userid } = req.session;
    console.log(`User data from session: ${isloggedin}${userid}`);

    if (isloggedin && userid) {
        const selectSQL = `SELECT * FROM user WHERE user_id = ?`;

        conn.query(selectSQL, [userid], (err, rows) => {
            if (err) {
                console.error('Error fetching user details:', err);
                res.status(500).send('Internal Server Error');
                return;
            }

            // Check if any rows were returned
            if (rows.length === 0) {
                // Handle case where no data was found for the given user ID
                res.status(404).send('User details not found');
                return;
            }

            res.render('userdetails', { summary: rows, error: null, success: null });
        });
    }
};  */


exports.postSignup = async (req, res) => {
    const { firstname, lastname, username, userpass, user_type_id } = req.body;
    const hash = await bcrypt.hash(userpass, 12);

    const endpoint = `http://localhost:3002/signup`;
    const userData = {
        firstname,
        lastname,
        username,
        userpass: hash, // Sending the hashed password
        user_type_id
    };

    try {
        const response = await axios.post(endpoint, userData, { validateStatus: status => status < 500 });
        const { status, data } = response;

        if (status === 200) {
            const { result } = data;
            console.log(result);
            res.render('login', { summary: result, success: 'Account created successfully - please log in', error: null });
        } else {
            console.log('Unexpected response status:', status);
            res.redirect('/');
        }
    } catch (error) {
        console.log(`Error making API request: ${error}`);
        // Handle error when making the API request
        res.redirect('/login');
    }
};


exports.postUpdateDetails = async (req, res) => {
    const { firstname, lastname, username, userpass } = req.body;
    const userId = req.session.userid;

    const vals = { firstname, lastname, username, userpass };

    const endpoint = `http://localhost:3002/user/${userId}/update`;

    try {
        const response = await axios.post(endpoint, vals);
        const data = response.data.result;
        console.log(data);

        // Assuming the API returns updated user details upon successful update
        const session = req.session;
        session.isloggedin = true;
        session.userid = data[0].id;
        console.log(session);

        var orig_route = req.session.route || '/';
        console.log(`postLogin: orig_route: ${orig_route}`);
        res.redirect(orig_route);
    } catch (error) {
        if (error.response) {
            console.log(error.response.status);
            const errordata = error.response.data;
            console.log(errordata);
            res.redirect('/login');
        } else if (error.request) {
            console.log(`Error making API request: ${error}`);
        } else {
            console.log(`Unexpected error: ${error}`);
        }
    }
};

