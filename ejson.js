#!/usr/bin/env node
'use strict';


var fs = require('fs');
var path = require('path');

var NodeRSA = require('node-rsa');
var parseArgs = require('minimist');


// set up parameters

var args = parseArgs(process.argv.slice(2)), op, fileName, keyName = args.k;

if (!('e' in args ^ 'd' in args)) {
    console.log('Usage: ejson [-k keyFile] -e|-d [file]');
    console.log('  Option -e: encrypt a file');
    console.log('  Option -d: decrypt a file');
    console.log('  Option -k: use this file as a key, default: ~/.ssh/id_rsa');
    console.log('  If "file" is not specified ~/.credentials.json is used for encoding, and ~/.credentials.json.enc is used for decoding');
    process.exit(1);
}

if (args.e) {
    op = 'encrypt';
    fileName = args.e;
} else {
    op = 'decrypt';
    fileName = args.d;
}

if (typeof fileName != 'string') {
    fileName = args._[0];
}

if (typeof fileName != 'string') {
    fileName = path.resolve(process.env.HOME, op == 'encrypt' ? '.credentials.json' : '.credentials.json.enc');
}

if (typeof keyName != 'string') {
    keyName = path.resolve(process.env.HOME, '.ssh/id_rsa');
}

var outName = fileName;

switch (op) {
    case 'encrypt':
        outName += '.enc';
        console.log('Encrypting', fileName, 'to', outName, 'using', keyName, '...');
        break;
    case 'decrypt':
        if (/\.enc$/.test(outName)) {
            outName = outName.substr(0, outName.length - 4);
        } else {
            outName += '.json';
        }
        console.log('Decrypting', fileName, 'to', outName, 'using', keyName, '...');
        break;
}


// do it

try {
    var key = new NodeRSA(fs.readFileSync(keyName), 'pkcs1-private-pem'),
        input = fs.readFileSync(fileName);
    if (op === '-e') {
        // check if valid JSON
        JSON.parse(input.toString());
    }
    var output = key[op](input);
    if (op === '-d') {
        // check if valid JSON
        JSON.parse(output.toString());
    }
    fs.writeFileSync(outName, output);
    fs.unlinkSync(fileName);
    console.log('Done');
} catch(e) {
    console.error('ERROR:', e);
    process.exit(2);
}

process.exit(0);
