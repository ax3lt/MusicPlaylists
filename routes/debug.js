var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('misc/debug', {title: 'Debug', user: req.session.user});
});

router.post('/post', function (req, res, next) {
    console.log(req.body);
    return res.json(req.body);
});

router.get('/get', function (req, res, next) {
    console.log(req.query);
    return res.json(req.query);
});
module.exports = router;
