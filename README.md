# ZipDown.js

## Overview

ZipDown is a simple Node.js API which allows to easily download zip archives
of directories and files from a configured path. It makes use of the
[archiver](https://www.npmjs.com/package/archiver) node module to do that.

## API

It has 3 routes:

  - ``GET /``: Returns an html page which links the files and directories names
    to the corresponding ``GET /zip`` API call.

  - ``GET /list``: Returns a JSON array listing the name of all the files and
    directories in the configured path.

  - ``GET /zip/FILE_NAME``: Where ``FILE_NAME`` is the name of a file/directory.

    zip on-the-fly and download the given file/directory if it is found in the
    configured path.

It can return the following http codes:

| HTTP code | Meaning                          |
|-----------|----------------------------------|
| 200       | The API call worked              |
| 404       | The url asked for does not exist |
| 405       | The method is not supported      |
| 500       | A filesystem error happened      |

## Starting the server

First ensure you have [node](https://nodejs.org/en/) and
[npm](https://www.npmjs.com/) installed.

You can then clone this repo and install the dependencies:

```sh
git clone git@github.com:peaBerberian/zipdown.js.git
cd zipdown.js
npm install --only=prod
```

You will need to set a config for the server, this is done through a
``config.json`` file that you will have to create.
A config example is available in ``./config.json.example`` .

Basically it is a JSON taking two properties:
  - `port`: The server port, as a number
  - `rootDirectory`: The directory the list from the APIs are based on.

Once everything is done, to start the server, just type:
```sh
npm run start
```

## TODO

The API already works but there is some improvements I might do in the future:
  - HTTPs support
  - Listing by modification date in ``/list`` and ``/`` API
  - CSS for ``/`` API
