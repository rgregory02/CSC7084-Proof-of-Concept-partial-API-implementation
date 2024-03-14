const conn = require('../utils/dbconn');


exports.getIndex  = (req, res) => {

    res.render('/', { error: null, success: null });
};

exports.getSnapshot = (req, res) => {


    const { userid } = req.params;
    const selectSQL = `SELECT * FROM emotion_snapshot WHERE user_id = ?`;
    conn.query(selectSQL, [userid], (err, rows) => {
        if (err) {
            res.status(500).json({
                status: 'failure',
                message: err
            });
        } else {
            res.status(200).json({
                status: 'success',
                message: `${rows.length} records retrieved`,
                result: rows
            });
        }
    });
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
    
        const insertSQL = `INSERT INTO emotion_snapshot (enjoyment_level, sadness_level, anger_level, contempt_level, disgust_level, fear_level, surprise_level, list_contextual_trigger, contextual_trigger, timestamp, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
        conn.query(insertSQL, vals, (err, result) => {
            if (err) {
                console.error('Error inserting snapshot:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            console.log('Snapshot inserted successfully');
            res.status(201).json({ message: 'Snapshot inserted successfully', result: result });
        });
    };
    


exports.selectSnapshot = (req, res) => {

    const {snapshotid} = req.params;

    const selectSQL = `SELECT * FROM emotion_snapshot WHERE emotion_snapshot_id = ?`;
    conn.query(selectSQL, [snapshotid], (err, rows) => {
    if (err) {
        res.status(500).json({
            status: 'failure',
            message: err
        });
    } else {
        if (rows.length > 0) {
        res.status(200);
        res.json({
        status: 'success',
        message: `Record ID ${snapshotid} retrieved`,
        result: rows
        });
        } else {
        res.status(404);
        res.json({
        status: 'failure',
        message: `Invalid ID ${snapshotid}`
        });
        }
        }
        });
        };


//basic update api that works - ?doesn't account for checkboxes
exports.updateSnapshot = (req, res) => {
    const {snapshotid} = req.params;

    const { enjoyment_level, sadness_level, anger_level, contempt_level, disgust_level, fear_level, surprise_level, list_contextual_trigger, contextual_trigger, new_date } = req.body;
    const vals = [enjoyment_level, sadness_level, anger_level, contempt_level, disgust_level, fear_level, surprise_level, list_contextual_trigger, contextual_trigger, new_date, snapshotid];

    console.log(vals);

    const updateSQL = 'UPDATE emotion_snapshot SET enjoyment_level = ?, sadness_level = ?, anger_level = ?, contempt_level = ?, disgust_level = ?, fear_level = ?, surprise_level = ?, list_contextual_trigger = ?, contextual_trigger = ?, timestamp = ? WHERE emotion_snapshot_id = ?';

    conn.query(updateSQL, vals, (err, rows) => {
        if (err) {
            res.status(500).json({
                status: 'failure',
                message: err
            });
        } else {
            if (rows.affectedRows > 0) {
                res.status(200).json({
                    status: 'success',
                    message: `Record ID ${snapshotid} updated`
                });
            } else {
                res.status(404).json({
                    status: 'failure',
                    message: `Invalid ID ${snapshotid}`
                });
            }
        }
    });
}; 

exports.updateSnapshotPatch = (req, res) => {
    const {snapshotid} = req.params;
    const { new_date } = req.body;
    const vals = [ new_date, snapshotid ];
    console.log(vals);
    const updateSQL = 'UPDATE emotion_snapshot SET timestamp = ? WHERE emotion_snapshot_id = ?';
    
    conn.query(updateSQL, vals, (err, rows) => {
    
    if (err) {
        res.status(500);
        res.json({
            status: 'failure',
            message: err
        });
    } else {
        if (rows.affectedRows > 0) {
            res.status(200);
            res.json({
                status: 'success',
                message: `Record ID ${snapshotid} updated`
            });
        } else {
            res.status(404);
            res.json({
                status: 'failure',
                message: `Invalid ID ${snapshotid}`
            });
        }
        }
    });
};

exports.deleteSnapshot = (req, res) => {
    const { snapshotid } = req.params;

    const deleteSQL = `DELETE FROM emotion_snapshot WHERE emotion_snapshot_id = ?`;
    conn.query(deleteSQL, [snapshotid], (err, rows) => {
        if (err) {
            res.status(500).json({
                status: 'failure',
                message: err
            });
        } else {
            if (rows.affectedRows > 0) {
                res.status(200).json({
                    status: 'success',
                    message: `Record ID ${snapshotid} deleted`
                });
            } else {
                res.status(404).json({
                    status: 'failure',
                    message: `Invalid ID ${snapshotid}`
                });
            }
        }
    });
};

exports.getSummaryChart = (req, res) => {
    const { userid } = req.params;

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
    };

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
                // Send JSON response with the processed data for filters
                res.json({ snapshotData, counts });
            })
            .catch(err => {
                console.error('Error fetching filtered summary data:', err);
                res.status(500).json({ error: 'Internal Server Error' });
            });
    } else {
        // No filters provided, fetch all data
        const selectAllSQL = `SELECT * FROM emotion_snapshot WHERE user_id = ?`;
        const paramsAll = [userid];

        fetchSummaryData(selectAllSQL, paramsAll)
            .then(rows => {
                // Process the retrieved rows (data) for all
                const { counts, snapshotData } = processSummaryData(rows);
                // Send JSON response with the processed data for all
                res.json({ snapshotData, counts });
            })
            .catch(err => {
                console.error('Error fetching all summary data:', err);
                res.status(500).json({ error: 'Internal Server Error' });
            });
    }
};

