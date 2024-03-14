const express = require('express');
//const bodyparser = require('body-parser');
const morgan = require('morgan');
const dotenv = require('dotenv').config({ path: './config.env' });
const snapshotrouter = require('./routes/snapshotroutes');
const userrouter = require('./routes/userroutes');
//const bcrypt = require('bcrypt');

const app = express();

app.use(morgan('tiny'));
app.use(express.urlencoded({ extended: false })); 

app.use(express.json());

app.use('/', userrouter);
//app.use('/snapshot', snapshotrouter);
app.use('/user', snapshotrouter);

app.listen(process.env.PORT, (err) => {
    if (err) return console.log(err);

    console.log(`Express listening on port ${process.env.PORT}`);
});