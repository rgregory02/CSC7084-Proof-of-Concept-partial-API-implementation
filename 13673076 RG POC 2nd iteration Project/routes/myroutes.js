const express = require('express');
const controller = require('./../controllers/mycontrollers');
//const conn = require('../utils/dbconn');
const router = express.Router();
const { isAuth } = require('./../middleware/auth');
const { check, validationResult } = require('express-validator');


router.get('/signup', controller.getSignup);
router.get('/login', controller.getLogin);
router.get('/logout', controller.getLogout);
//router.get('/userdetails', isAuth, controller.selectUserDetails);

router.get('/', controller.getSnapshot);
router.get('/new', isAuth, controller.getAddNewSnapshot);
//router.get('/edit/:id', isAuth, controller.selectSnapshot);
//router.get('/summarychart', isAuth, controller.getSummaryChart);

router.post('/new', controller.postNewSnapshot);
router.post('/edit/:id', controller.updateSnapshot);
router.post('/del/:id', controller.deleteSnapshot);

router.post('/signup', controller.postSignup);


router.post('/login', controller.postLogin);

router.post('/userdetails', controller.postUpdateDetails);



module.exports = router;