/*
 * This file is part of CabasVert.
 *
 * Copyright 2017, 2018 Didier Villevalois
 *
 * CabasVert is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * CabasVert is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CabasVert.  If not, see <http://www.gnu.org/licenses/>.
 */

const fs = require('fs-extra');
const http = require('http');
const { docker, run, runDaemon } = require('./run-utils');

async function runDatabase({ databaseName, databaseHost }) {

  const tmp = databaseName == null ? null : databaseName.split(':');
  const database = databaseName == null ? null : {
    name: tmp[0] || 'couchdb',
    version: tmp[1] || 'latest',
  };

  const { handle, host, oneShot } = selectDatabase(database, databaseHost);

  // Launch the database host
  const destroy = await handle;

  async function ready() {
    // Wait for the database to be ready
    await waitForDatabase(host);

    // Add CORS to the database configuration
    // Fails with pouchdb-server (see pouchdb/add-cors-to-couchdb#24)
    if (oneShot && database && database.name !== 'pouchdb-server') {
      await run('add-cors-to-couchdb', [host]);
    }
  }

  return { ready, destroy, host, oneShot };
}

function selectDatabase(database, databaseHost) {
  if (!database) {
    return {
      handle: Promise.resolve(null),
      host: databaseHost || 'http://localhost:5984',
      oneShot: false,
    };
  }

  // CouchDB
  if (database.name === 'couchdb') {
    const dockerImage = 'couchdb:' + database.version;
    return {
      handle: docker(dockerImage, ['3000:5984']),
      host: 'http://localhost:3000',
      oneShot: true,
    };
  }

  // PouchDB Server
  else if (database.name === 'pouchdb-server') {
    let configFile = 'pouchdb-server-config.json';
    return {
      handle: runDaemon('pouchdb-server', [
        '--in-memory',
        '--port', '3000',
        '--config', configFile,
      ], {
        cleanupHandler: async () => {
          await fs.unlink('log.txt');
          await fs.unlink(configFile);
        },
      }),
      host: 'http://localhost:3000',
      oneShot: true,
    };
  }

  // Unknown
  throw new Error('Unknown DATABASE \'' + database.name + '\'. Did you mean pouchdb-server?');
}

function waitForDatabase(url) {
  return new Promise(function (resolve) {
    const interval = setInterval(function () {
      const request = http.request(url, function (res) {
        if (res.statusCode === 200) {
          clearInterval(interval);
          resolve();
        }
      });
      request.on('error', function () {
        console.info('Waiting for CouchDB on ' + url);
      });
      request.end();
    }, 1000);
  });
}

module.exports = {
  runDatabase,
};
