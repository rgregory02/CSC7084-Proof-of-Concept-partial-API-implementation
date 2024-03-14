const express = require('express');
const bodyparser = require('body-parser');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv').config({ path: './config.env' });
const session = require('express-session');
const router = require('./routes/myroutes');
const bcrypt = require('bcrypt');

//const conn = require('./utils/dbconn');

//const router = express.Router();
//const PORT = 3000;

const app = express();
app.use(morgan('tiny'));
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.urlencoded({ extended: true }));
app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json())



app.use(session({
    secret: 'mysecretstring1234',
    resave: false,
    saveUninitialized: false
    }));

app.use('/', router);
app.set('view engine', 'ejs');
app.use('*', (req, res) => {
    res.status(404).render('404');
});

app.listen(process.env.PORT, (err) => {
    if (err) return console.log(err);
    console.log(`Express listening on port ${process.env.PORT}`);
    });
