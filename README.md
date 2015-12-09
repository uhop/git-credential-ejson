# git-credential-ejson

Git credential helper that keeps its data store in an encrypted JSON using id_rsa or similar certificate.

## Installation

```
npm install git-credential-ejson
```

## Usage

```
git config credential.helper ejson
```

Or:

```
git config credential.helper 'ejson [options]'
```

Where `[options]` are:

* `-k cert` &mdash; a certificate file. If not specified, defaults to `~/.ssh/id_rsa`.
* `-f name` &mdash; a store file. If not specified, defaults to `~/.credentials.json.enc`.

## Utility: ejson

This utility is installed with the git credential helper. It helps to deal with the store.

```
ejson [-k cert] -e|-d|-l [name]
```

Details:

* `-e` &mdash; encrypt a store.
* `-d` &mdash; decrypt a store.
* `-l` &mdash; print an encrypted file in clear text.
* `-k cert` &mdash; use this file as a key, defaults to `~/.ssh/id_rsa`.
* If `name` is not specified then defaults to:
  * `~/.credentials.json` is used for encoding
  * `~/.credentials.json.enc` is used for decoding and printing.

## License

New BSD.
