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

const runDatabase = require('./run-database');

require('ts-node').register();

const Jasmine = require('jasmine');
const SpecReporter = require('jasmine-spec-reporter').SpecReporter;

async function main() {
  await runDatabase({
    databaseName: process.env.DATABASE,
    databaseHost: process.env.DATABASE_HOST,
  }, runTests);
}

function runTests(databaseHost) {

  global['__testConfig__'] = {
    databaseHost,
  };

  return new Promise((resolve, reject) => {
    const jasmine = new Jasmine();

    jasmine.loadConfig({
      stopSpecOnExpectationFailure: false,
      random: false,
    });

    jasmine.env.clearReporters();
    jasmine.addReporter(new SpecReporter({
      spec: {
        displayPending: true,
      },
      summary: {
        displayStacktrace: 'all',
      },
    }));

    jasmine.onComplete((passed) => {
      if (passed) {
        resolve();
      } else {
        reject(1);
      }
    });

    jasmine.execute(process.argv.slice(2));
  });
}

main();
