const express = require('express');
const controller = require('../controllers/usercontroller');
const router = express.Router();
const { check, validationResult } = require('express-validator');


router.get('/:userid/details', controller.getUserDetails);
router.get('/:userid/summary', controller.selectUserDetails);

router.post('/login', 
check('username')
        .exists()
        .isLength({ min: 5 })
        .withMessage('Username must be at least 5 characters!'),
controller.postAPILogin);

router.post('/signup',
check('username')
        .exists()
        .isLength({ min: 5 })
        .withMessage('Username must be at least 5 characters!'),
controller.postSignup);

router.post('/:userid/update', 
check('username')
            .exists()
            .isLength({ min: 5 })
            .withMessage('Username must be at least 5 characters!'),
controller.updateUserDetails);







module.exports = router;