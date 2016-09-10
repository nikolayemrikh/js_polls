var express = require('express');
var router = express.Router();

var poll = require('../../db/poll');

router.get('/', function(req, res) {
    var args = {};
    poll.list(args, function(err, data) {
        if (!err && data) {
            res.json(data);
        }
        else {
            res.status(400).end();
        }
    });
});
// Get poll by id
router.get('/:id', function(req, res) {
   var args = {
       id: req.params.id
   };
   poll.get(args, function(err, data) {
       console.log(err)
       if (!err && data) {
            res.json(data);
        }
        else {
            res.status(400).end();
        }
   });
});
// Create new poll
router.post('/', function(req, res) {
    var args = {
        data: req.body
    };
    poll.add(args, function(err, data) {
        if (!err && data) {
            console.log(err, data)
            //res.status(200).end();
            res.json(data);
        }
        else {
            console.log(err, data)
            //res.status(400).end();
            res.status(400).end();
        }
    });
});
// Update poll
router.put('/:id', function(req, res) {
    var args = {
        id: req.params.id,
        data: req.body
    };
    poll.update(args, function(err, data) {
        if (!err && data) {
            /*req.login(data, function(error) {
                if (error) res.status(400).end();
                else res.json(data);
            });*/
            res.json(data);
        }
        else {
            res.status(400).end();
        }
    });
});

router.delete('/:id', function(req, res) {
    var args = {
        id: req.params.id
    };
    poll.delete(args, function(err, data) {
        if (!err && data) {
            res.status(200).end();
        }
        else {
            res.status(400).end();
        }
    });
});

module.exports = router;