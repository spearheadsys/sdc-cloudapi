// Copyright 2011 Joyent, Inc.  All rights reserved.

var test = require('tap').test;
var uuid = require('node-uuid');

var common = require('./common');



///--- Globals

var client;
var KEY = 'ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAIEAvad19ePSDckmgmo6Unqmd8' +
    'n2G7o1794VN3FazVhV09yooXIuUhA+7OmT7ChiHueayxSubgL2MrO/HvvF/GGVUs/t3e0u4' +
    '5YwRC51EVhyDuqthVJWjKrYxgDMbHru8fc1oV51l0bKdmvmJWbA/VyeJvstoX+eiSGT3Jge' +
    'egSMVtc= mark@foo.local';



///--- Helpers

function checkKey(t, key) {
    t.ok(key);
    t.ok(key.name);
    t.ok(key.key);
}



///--- Tests

test('setup', function(t) {
    common.setup(function(err, _client) {
        t.ifError(err);
        t.ok(_client);
        client = _client;
        t.end();
    });
});


test('ListKeys (empty) OK', function(t) {
    client.get('/my/keys', function(err, req, res, body) {
        t.ifError(err);
        t.equal(res.statusCode, 200);
        common.checkHeaders(t, res.headers);
        t.ok(body);
        t.ok(Array.isArray(body));
        t.ok(!body.length);
        t.end();
    });
});


test('CreateKey (missing key)', function(t) {
    client.post('/my/keys', {}, function(err) {
        t.ok(err);
        t.equal(err.httpCode, 409);
        t.equal(err.restCode, 'MissingParameter');
        t.ok(err.message);
        t.end();
    });
});


test('CreateKey (named) OK', function(t) {
    var key = {
        key: KEY,
        name: 'id_rsa 1'
    };
    client.post('/my/keys', key, function(err, req, res, body) {
        t.ifError(err);
        t.ok(body)
        t.equal(res.statusCode, 201);
        common.checkHeaders(t, res.headers);
        checkKey(t, body);
        t.end();
    });
});


test('ListKeys OK', function(t) {
    client.get('/my/keys', function(err, req, res, body) {
        t.ifError(err);
        t.equal(res.statusCode, 200);
        common.checkHeaders(t, res.headers);
        t.ok(body);
        t.ok(body.length);
        body.forEach(function(k) {
            checkKey(t, k);
        });
        t.end();
    });
});


test('GetKey OK', function(t) {
    var url = '/my/keys/' + encodeURIComponent('id_rsa 1');
    client.get(url, function(err, req, res, body) {
        t.ifError(err);
        t.equal(res.statusCode, 200);
        common.checkHeaders(t, res.headers);
        t.ok(body)
        checkKey(t, body);
        t.end();
    });
});


test('DeleteKey OK', function(t) {
    var url = '/my/keys/' + encodeURIComponent('id_rsa 1');
    client.del(url, function(err, req, res) {
        t.ifError(err);
        t.equal(res.statusCode, 204);
        common.checkHeaders(t, res.headers);
        t.end();
    });
});


test('DeleteKey 404', function(t) {
    client.del('/my/keys/' + uuid(), function(err) {
        t.ok(err);
        t.equal(err.httpCode, 404);
        t.equal(err.restCode, 'ResourceNotFound');
        t.ok(err.message);
        t.end();
    });
});


var name;
var fp;
test('CreateKey OK', function(t) {
    client.post('/my/keys', { key: KEY }, function(err, req, res, body) {
        t.ifError(err);
        t.equal(res.statusCode, 201);
        common.checkHeaders(t, res.headers);
        t.ok(body)
        checkKey(t, body);
        name = body.name
        fp = body.fingerprint;
        t.end();
    });
});


test('Cleanup Key', function(t) {
    var path = '/my/keys/' + encodeURIComponent(name);
    client.del(path, function(err, req, res) {
        t.ifError(err);
        t.equal(res.statusCode, 204);
        common.checkHeaders(t, res.headers);
        t.end();
    });
});


test('GetKey 404', function(t) {
    client.get('/my/keys/' + uuid(), function(err) {
        t.ok(err);
        t.equal(err.httpCode, 404);
        t.equal(err.restCode, 'ResourceNotFound');
        t.ok(err.message);
        t.end();
    });
});


test('teardown', { timeout: 'Infinity' }, function(t) {
    function nuke(callback) {
        client.teardown(function(err) {
            if (err)
                return setTimeout(function() { return nuke(callback) }, 500);

            return callback(null);
        });
    }

    return nuke(function(err) {
        t.ifError(err);
        t.end();
    });
});