var express = require('express');
var router = express.Router();
var config = require('nconf');

var rest = require('../db').dao('rest');

/**
 * CORS middleware.
 */
router.all('*', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type,X-Access-Token');
    next();
});

/**
 * Check permission for access to collection.
 * 
 * @param {String} req.headers['x-access-token']
 */
router.use(function(req, res, next) {
    var token = config.get('rest:' + req.headers['x-access-token']);
    if (!token) return res.status(401).end();
    var params = token[req.params.collection];
    if (!params) return res.status(403).end();
    switch (req.method) {
        case 'GET':
            if (!params.read) return res.status(403).end();
            res.locals.filter = params.read.filter;
            res.locals.sort = params.read.sort;
            res.locals.skip = params.read.skip;
            res.locals.limit = params.read.limit;
            res.locals.select = params.read.select;
            res.locals.populate = params.read.populate;
            break;
        case 'POST':
            if (!params.create) return res.status(403).end();
            break;
        case 'PUT':
            if (!params.update) return res.status(403).end();
            break;
        case 'DELETE':
            if (!params.delete) return res.status(403).end();
            break;
        default:
            return res.status(403).end();
    }
    next();
});

/**
 * Create document
 * 
 * @param {String} req.params.model
 * @param {Object} req.body
 * @returns {Object}
 */
router.post('/:model', function(req, res, next) {
    var args = {
        model: req.params.model,
        data: req.body
    };
    // create document
    rest.create(args, function(err, data) {
        if (err) return next(err);
        res.json(data);
    });
});

/**
 * Read documents from collection
 * 
 * @param {String} req.params.model
 * @param {Object} res.locals.filter || req.query.filter
 * @param {Number} res.locals.skip || req.query.skip
 * @param {Number} res.locals.limit || req.query.limit
 * @param {Object} res.locals.sort || req.query.sort
 * @param {Object} res.locals.select || req.query.select
 * @param {Object} res.locals.populate || req.query.populate
 * @returns {Array}
 */
router.get('/:model', function(req, res, next) {
    var args = {
        model: req.params.model,
        filter: typeof res.locals.filter === 'undefined' ? req.query.filter : res.locals.filter,
        skip: typeof res.locals.skip === 'undefined' ? req.query.skip : res.locals.skip,
        limit: typeof res.locals.limit === 'undefined' ? req.query.limit : res.locals.limit,
        sort: typeof res.locals.sort === 'undefined' ? req.query.sort : res.locals.sort,
        select: typeof res.locals.select === 'undefined' ? req.query.select : res.locals.select,
        populate: typeof res.locals.populate === 'undefined' ? req.query.populate : res.locals.populate
    };
    // execute query
    rest.read(args, function(err, data) {
        if (err) return next(err);
        res.json(data);
    });
});

/**
 * Get document by id
 * 
 * @param {String} req.params.model
 * @param {String} req.params.documentId
 * @param {Object} req.query.select
 * @param {Object} req.query.populate
 * @returns {Object}
 */
router.get('/:model/:documentId', function(req, res, next) {
    var args = {
        model: req.params.model,
        documentId: req.params.documentId,
        select: typeof res.locals.select === 'undefined' ? req.query.select : res.locals.select,
        populate: typeof res.locals.populate === 'undefined' ? req.query.populate : res.locals.populate
    };
    // execute query
    rest.read(args, function(err, data) {
        if (err) return next(err);
        res.json(data);
    });
});

/**
 * Update document by id
 * 
 * @param {String} req.params.model
 * @param {String} req.params.documentId
 * @param {Object} req.body
 * @returns {Object}
 */
router.put('/:model/:documentId', function(req, res, next) {
    var args = {
        model: req.params.model,
        documentId: req.params.documentId,
        data: req.body
    };
    // update document
    rest.update(args, function(err, data) {
        if (err) return next(err);
        res.json(data);
    });
});

/**
 * Delete document by id
 * 
 * @param {String} req.params.model
 * @param {String} req.params.documentId
 * @returns {Object}
 */
router.delete('/:model/:documentId', function(req, res, next) {
    var args = {
        model: req.params.model,
        documentId: req.params.documentId
    };
    // remove document
    rest.delete(args, function(err, data) {
        if (err) return next(err);
        res.json(data);
    });
});

module.exports = router;