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

'use strict';

if ('serviceWorker' in navigator &&
  (window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname.indexOf('127.') === 0)) {

  navigator.serviceWorker.register('service-worker.js', {
    scope: './'
  }).then(function (registration) {

    // Check to see if there's an updated version of service-worker.js with new files to cache
    if (typeof registration.update === 'function') {
      registration.update();
    }

    // updatefound is fired if service-worker.js changes
    registration.onupdatefound = function () {

      // The updatefound event implies that registration.installing is set
      var installingWorker = registration.installing;

      installingWorker.onstatechange = function () {
        switch (installingWorker.state) {
          case 'installed':
            if (navigator.serviceWorker.controller) {
              // At this point, the old content will have been purged
              // and the fresh content will have been added to the cache.
              alert('New or updated content is available. Please reload page.');
            } else {
              // At this point, everything has been precached, but the service worker is not
              // controlling the page. The service worker will not take control until the next
              // reload or navigation to a page under the registered scope.
              alert('Content is cached, and will be available for offline use the ' +
                'next time the page is loaded.')
            }
            break;

          case 'redundant':
            console.error('The installing service worker became redundant.');
            break;
        }
      };
    };
  }).catch(function (e) {
    console.error('Error during service worker registration:', e);
  });
}
