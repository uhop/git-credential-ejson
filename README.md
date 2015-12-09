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

Important notes:

* Decrypting or encrypting a store creates new file, and removes the old one.
* `git-credential-ejson` does **NOT** work with an unencrypted file.
* `ejson` does not print an unencrypted file.

## Internals

The credential file can be editied manually. For that it can be converted back and forth with `ejson` utility. **Important**: always make sure that it is a valid JSON!

Example of such file:

```json
{
  "example1.com": {
    "username": "qpublic",
    "password": "s0meRand0m$h!t"
  },
  "example2.com": {
    "username": "qprivate",
    "password": "yesssir!"
  },
  "example3.com:8080": {
    "username": "qwerty",
    "password": "yep-no-pass!"
  },
  "example3.com:8081": {
    "username": "qwerty",
    "password": "nope-no-pass!"
  },
  "https://user@example.com": {
    "password": "$uperDuper$ec4re$+4ff"
  },
  "user@example.com": {
    "password": "k!11b!11"
  },
  "http://example.com": {
    "username": "SecretOfLife42",
    "password": "weirdstuff"
  },
  "example.com": {
    "username": "catch22",
    "password": "tl;dr"
  }
}
```

It is a simple dictionary, with keys are pseudo-URI in different states of specificity. They are always tried from the most specific to the less specific using available information.

Values are a dictionary of simple strings, which are used to override credential information, usually `username` and `password`.

In the example above all requests for `example1.com` will be served with user name `qpublic` and password `s0meRand0m$h!t`. A port value is considered to be a part of host, as can be seen for values `example3.com:8080` and `example3.com:8081`.

The last four values listed in the order of a decreasing specificity (an order is not important) &mdash; that's how the helper will look for them. For example, if a git repository URL is `http://user@example.com`, the following sequence of searches will be performed:

1. `http://user@example.com`: fails.
2. `user@example.com`: succeeds, password `k!11b!11` will be returned, potentially overwriting any other password, e.g., supplied in the URL itself.

Another example: if a git repository URL is `https://example.com`, the following sequence of searches will be performed:

1. `https://example.com`: fails.
2. `example.com`: succeeds, user name `catch22` and password `tl;dr` will be returned, potentially overwriting any other user name and password.

Yet another example: if a git repository URL is `https://barry:white@example.com`, the following sequence of searches will be performed:

1. `https://barry@example.com`: fails.
2. `barry@example.com`: fails.
3. `https://example.com`: fails.
4. `example.com`: succeeds, user name `catch22` and password `tl;dr` will be returned overwriting `barry` and `white`.

While the helper can update its store automatically, it is possible to craft keys and values so they can cover different situations.

### Keys

The helper tries following keys in the given order:

1. protocol://username@host
2. username@host
3. protocol://host
4. host

A port, if specified, is considered to be a part of host. If a URL part is unknown, a key that depends on it is not generated. For example, if we don't know a user name, we skip keys that include it.

### Values

Every values is an object with properties that will replace/augment an existing information we have. Usually we specify `username` and `password`, but it can be `host`, `protocol`, and `path`. See the documentation of [git credential](https://www.kernel.org/pub/software/scm/git/docs/git-credential.html).

## License

New BSD.
