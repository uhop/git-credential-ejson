#!/usr/bin/env node
'use strict';


var fs = require('fs');
var path = require('path');

var NodeRSA = require('node-rsa');


var args = process.argv, op = args[2];

switch (true) {
    case args.length < 3:
    case args.length > 4:
    case {'-e': 1, '-d': 1}[op] !== 1:
        console.log('Usage: ejson -e|-d [file]');
        console.log('  Option -e: encrypt a file using ~/.ssh/id_rsa.pub');
        console.log('  Option -d: decrypt a file using ~/.ssh/id_rsa');
        console.log('  If "file" is not specified ~/.credentials.json is used for encoding, and ~/.credentials.json.enc is used for decoding');
        process.exit(1);
}

var DEFAULT_INPUT_NAMES = {
        '-e': path.resolve(process.env.HOME, '.credentials.json'),
        '-d': path.resolve(process.env.HOME, '.credentials.json.enc')
    },
    DEFAULT_KEY_NAMES = {
        '-e': path.resolve(process.env.HOME, '.ssh/id_rsa'),
        '-d': path.resolve(process.env.HOME, '.ssh/id_rsa')
    },
    OPS = {'-e': 'encrypt', '-d': 'decrypt'};

var iName = args[3] || DEFAULT_INPUT_NAMES[op], oName = iName,
    keyName = DEFAULT_KEY_NAMES[op];

switch (op) {
    case '-e':
        oName += '.enc';
        console.log('Encrypting', iName, 'to', oName, 'using', keyName, '...');
        break;
    case '-d':
        if (/\.enc$/.test(oName)) {
            oName = oName.substr(0, oName.length - 4);
        } else {
            oName += '.json';
        }
        console.log('Decrypting', iName, 'to', oName, 'using', keyName, '...');
        break;
}

try {
    var key = new NodeRSA(fs.readFileSync(keyName), 'pkcs1-private-pem'),
        input = fs.readFileSync(iName);
    if (op === '-e') {
        // check if valid JSON
        JSON.parse(input.toString());
    }
    var output = key[OPS[op]](input);
    if (op === '-d') {
        // check if valid JSON
        JSON.parse(output.toString());
    }
    fs.writeFileSync(oName, output);
    fs.unlinkSync(iName);
    console.log('Done');
} catch(e) {
    console.error('ERROR:', e);
    process.exit(2);
}
