const express = require('express');
const controller = require('../controllers/snapshotcontrollers');
const router = express.Router();


router.get('/:userid/snapshot', controller.getSnapshot);
router.get('/:userid/:snapshotid', controller.selectSnapshot);
router.get('/:userid/summarychart', controller.getSummaryChart);

router.post('/:userid/new', controller.postNewSnapshot);
router.put('/editput/:snapshotid', controller.updateSnapshot);
router.patch('/editpatch/:snapshotid', controller.updateSnapshotPatch);
router.delete('/delete/:snapshotid', controller.deleteSnapshot);



module.exports = router;