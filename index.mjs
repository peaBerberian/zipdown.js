import http from 'http';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import config from './config.mjs';

const PORT = config.port;
const ROOT_DIR = config.rootDirectory;

/**
 * Respond with a  404 code and generic 404 text message
 * @param {Object} request
 * @param {Object} response
 */
const handle404Request = (_request, response) => {
  response.writeHead(404, { 'Content-Type': 'text/plain' });
  response.write('404 Not Found\n');
  response.end();
};

/**
 * Respond with a generic 405 code and generic 405 text message
 * @param {Object} request
 * @param {Object} response
 */
const handleNotSupportedMethod = (_request, response) => {
  response.writeHead(405, { 'Content-Type': 'text/plain' });
  response.write('Method not supported\n');
  response.end();
};

/**
 * Respond with a text when the asked command failed.
 * @param {Error} error
 * @param {Object} response
 */
const handleError = (error, response) => {
  response.writeHead(500, { 'Content-Type': 'text/plain' });
  response.write('Request failed: ' + error.message + '.\n');
  response.end();
};

/**
 * Respond with:
 *   - if the asked file exist, a zip download as an attachment
 *   - if the asked file does not exist, a 500 error (should probably be a 404).
 * @param {Error} error
 * @param {Object} response
 */
const handleZipRequest = (request, response) => {
  try {
    // lazy way to sanitize the input as to avoid directory traversal
    const fileName = path.basename(request.url.substr(4, request.url.length));
    const pathName = `${ROOT_DIR}/${fileName}`;

    fs.stat(pathName, async (err, stats) => {
      if (err) {
        handleError(new Error('The asked file does not exist'), response);
      } else {
        response.writeHead(200, {
          'Content-Type': 'application/zip',
          'Content-disposition': `attachment; filename=${fileName}.zip`
        });

        const zip = archiver('zip');
        try {
          if (stats.isFile()) {
            zip.pipe(response);
            await zip.file(pathName, { name: fileName }).finalize();
          } else if (stats.isDirectory()) {
            zip.pipe(response);
            await zip.directory(pathName, path.basename(pathName)).finalize();
            console.warn("DONE");
          } else {
            throw new Error('The asked file is neither a file nor  directory');
          }
        } catch (err) {
          console.warn("FAILED");
          handleError(err, response);
        }
      }
    });
  } catch (e) {
    // should not happen:
    // path.basename can throw if given an incorrect string (throws a
    // TypeError).
    handleError(new Error('Something unexpected happened, please ' +
      're-check your input'), response);
  }
};

/**
 * Tries to read the root directory and returns a promise:
 *   - resolving with the files in argument if the IO call works
 *   - rejecting with a generic error if fails
 * @returns {Promise}
 */
const readRootDirectory = () => {
  return new Promise((res, rej) => {
    fs.readdir(ROOT_DIR, (err, files) => {
      if (err) {
        rej(new Error('Could not read the root directory'));
      } else {
        res(files);
      }
    });
  });
};

/**
 * Respond with a JSON containing a list of the files/dir in the given
 * ROOT_DIR.
 * @param {Object} request
 * @param {Object} response
 */
const handleListRequest = (_request, response) => {
  readRootDirectory().then((files) => {
    response.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8'
    });
    response.write(JSON.stringify(files), 'utf8');
    response.end();
  }, (err) => {
    handleError(err, response);
  });
};

/**
 * Returns a string representing a simple HTML page with a list of each file
 * linked to its corresponding /zip url.
 *
 * @param {Array.<string>} files
 * @returns {string}
 */
const constructHTMLList = (files) => {
  return '<html><head><title>List of available archives</title>' +
    '<meta name="viewport" content="width=device-width"></head>' +
    '<body><ul>' +
    files.map((f) => {
      return `<li><a href="./zip${f}">${f}</a></li>`;
    }).join('') +
    '</ul></body>' +
    '</html>';
};

/**
 * Respond with a HTML listing the files/dir in the ROOT_DIR.
 * @param {Object} request
 * @param {Object} response
 */
const handleHTMLRequest = (_request, response) => {
  readRootDirectory().then((files) => {
    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8'
    });
    response.write(constructHTMLList(files), 'utf8');
    response.end();
  }, (err) => {
    handleError(err, response);
  });
};

/**
 * Handle every request.
 * Re-dispatch to the right function given the url.
 * @param {Object} request
 * @param {Object} response
 */
const handleRequest = (request, response) => {
  if (request.method !== 'GET') {
    handleNotSupportedMethod(request, response);
  } else if (request.url === '/') {
    handleHTMLRequest(request, response);
  } else if (request.url === '/list') {
    handleListRequest(request, response);
  } else if (request.url.substr(0, 4) === '/zip') {
    handleZipRequest(request, response);
  } else {
    handle404Request(request, response);
  }
};

// launch it
const server = http.createServer(handleRequest);
server.listen(PORT, () => {
  console.log(`server started on ${PORT}`);
});
