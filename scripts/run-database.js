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
const runUtils = require('./run-utils');

async function runDatabase({ databaseName, databaseHost }, promiseFactory) {

  const tmp = databaseName == null ? null : databaseName.split(':');
  const database = databaseName == null ? null : {
    name: tmp[0] || 'couchdb',
    version: tmp[1] || 'latest',
  };

  const { handlePromise, host } = selectDatabase(database, databaseHost);

  // Launch the database host
  const handle = await handlePromise;

  // Wait for the database to be ready
  await waitForDatabase(host);

  // Add CORS to the database configuration
  // Fails with pouchdb-server (see pouchdb/add-cors-to-couchdb#24)
  if (database && database.name !== 'pouchdb-server') {
    console.log('\nExecuting add-cors-to-couchdb');
    await runUtils.npm('add-cors-to-couchdb', [host]);
  }

  try {
    try {
      // Run the inner job
      await promiseFactory(host);
    } finally {
      // Destroy the database host
      if (handle) {
        await handle.destroy();
      }
    }
  } catch (exitCode) {
    process.exit(exitCode);
  }
}

function selectDatabase(database, databaseHost) {
  if (!database) {
    return {
      handlePromise: Promise.resolve(null),
      host: databaseHost || 'http://localhost:5984',
    };
  }

  // CouchDB
  if (database.name === 'couchdb') {
    const dockerImage = 'couchdb:' + database.version;
    return {
      handlePromise: runUtils.docker(dockerImage, ['3000:5984']),
      host: 'http://localhost:3000',
    };
  }

  // PouchDB Server
  else if (database.name === 'pouchdb-server') {
    let configFile = 'pouchdb-server-config.json';
    return {
      handlePromise: runUtils.npmDaemon('pouchdb-server', [
        '--in-memory',
        '--port', '3000',
        '--config', configFile,
      ], async () => {
        await fs.unlink('log.txt');
        await fs.unlink(configFile);
      }),
      host: 'http://localhost:3000',
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

module.exports = runDatabase;
