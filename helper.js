#!/usr/bin/env node
'use strict';


var fs = require('fs');
var path = require('path');
var readline = require('readline');
var url = require('url');

var NodeRSA = require('node-rsa');
var parseArgs = require('minimist');


// set up parameters

var args = parseArgs(process.argv.slice(2)), fileName = args.f, keyName = args.k, op = args._[0];

if (typeof fileName != 'string') {
    fileName = path.resolve(process.env.HOME, '.credentials.json.enc');
}

if (typeof keyName != 'string') {
    keyName = path.resolve(process.env.HOME, '.ssh/id_rsa');
}


// get files

var encoder = new NodeRSA(fs.readFileSync(keyName), 'pkcs1-private-pem'), data, store;

try {
    data = fs.readFileSync(fileName);
} catch(e) {
    store = {};
}

if (!store) {
    store = JSON.parse(encoder.decrypt(data));
}

if (!store || store instanceof Array || typeof store != 'object') {
    store = {};
}


// read all lines

var rl = readline.createInterface({
        input:  process.stdin,
        output: process.stdout
    }), dict = {};


var LINE_PARSER = /^(\w+)\s*=\s*(.*)$/;


var done = false;

rl.on('line', function (line) {
    if (done) {
        return;
    }

    line = line.trim();
    if (line) {
        var parts = LINE_PARSER.exec(line), t;
        if (parts) {
            if (parts[1] === 'url') {
                var parsed = url.parse(parts[2], false, true);
                if (parsed.protocol) {
                    t = /^(\w+):$/.exec(parsed.protocol);
                    if (t) {
                        parsed.protocol = t[1];
                    }
                }
                if (parsed.path) {
                    t = /^\/(.+)$/.exec(parsed.path);
                    if (t) {
                        parsed.path = t[1];
                    }
                }
                if (parsed.auth) {
                    t = /^([^:]*):(.+)$/.exec(parsed.auth);
                    if (t) {
                        parsed.username = t[1];
                        parsed.password = t[2];
                    } else {
                        parsed.username = parsed.auth;
                    }
                }
                copyProps(dict, parsed, ['protocol', 'host', 'path', 'username', 'password']);
            } else {
                dict[parts[1]] = parts[2];
            }
        }
    } else {
        doIt();
    }
}).on('close', function () {
    doIt();
});


function copyProps (dst, src, props) {
    var key, i;
    if (!props) {
        for (key in src) {
            if (src.hasOwnProperty(key)) {
                dst[key] = src[key];
            }
        }
        return dst;
    }
    if (props instanceof Array) {
        for (i = 0; i < props.length; ++i) {
            key = props[i];
            if (src.hasOwnProperty(key)) {
                dst[key] = src[key];
            }
        }
        return dst;
    }
    if (typeof props == 'object') {
        for (key in props) {
            var dstKey = props[key];
            if (src.hasOwnProperty(key) && typeof dstKey == 'string') {
                dst[dstKey] = src[key];
            }
        }
        return dst;
    }
    return dst;
}

function mutate (array, mutator) {
    return array.map(mutator).concat(array);
}

function doIt () {
    if (done) {
        return;
    }
    done = true;

    if (dict.host) {
        switch (op) {
            case 'get':
                var keys = [dict.host];
                if (dict.hasOwnProperty('username')) {
                    var keys2 = keys.map(function (host) { return dict.username + '@' + host; });
                    if (dict.hasOwnProperty('password')) {
                        var keys3 = keys.map(function (host) { return dict.username + ':' + dict.password + '@' + host; });
                        keys = keys3.concat(keys2, keys);
                    } else {
                        keys = keys2.concat(keys);
                    }
                }
                if (dict.hasOwnProperty('protocol')) {
                    keys = mutate(keys, function (host) { return dict.protocol + '://' + host; });
                }
                keys.some(function (key) {
                    if (store.hasOwnProperty(key)) {
                        copyProps(dict, store[key]);
                        for (var key in dict) {
                            if (dict.hasOwnProperty(key)) {
                                console.log(key + '=' + dict[key]);
                            }
                        }
                        return true;
                    }
                    return false;
                });
                break;
            case 'store':
                if (dict.hasOwnProperty('username') && dict.hasOwnProperty('password')) {
                    keys = [
                        dict.protocol + '://' + dict.username + '@' + dict.host,
                        dict.username + '@' + dict.host,
                        dict.protocol + '://' + dict.host,
                        dict.host
                    ];
                    var flag = keys.some(function (key) {
                        if (store.hasOwnProperty(key)) {
                            store[key] = {username: dict.username, password: dict.password};
                            return true;
                        }
                        return false;
                    });
                    if (!flag) {
                        store[dict.host] = {username: dict.username, password: dict.password};
                    }
                    fs.writeFileSync(fileName, encoder.encrypt(JSON.stringify(store, null, 2)));
                }
                break;
            case 'erase':
                if (dict.hasOwnProperty('username')) {
                    keys = [
                        dict.protocol + '://' + dict.username + '@' + dict.host,
                        dict.username + '@' + dict.host,
                        dict.protocol + '://' + dict.host,
                        dict.host
                    ];
                    keys.some(function (key) {
                        return delete store[key];
                    });
                    fs.writeFileSync(fileName, encoder.encrypt(JSON.stringify(store, null, 2)));
                }
                break;
        }
    }
}
