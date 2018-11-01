# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.2.2-beta.6](https://github.com/cabasvert/cabasvert/compare/@cabasvert/server@0.2.2-beta.5...@cabasvert/server@0.2.2-beta.6) (2018-11-01)


### Bug Fixes

* **server:** generate client config only if needed ([d4308b1](https://github.com/cabasvert/cabasvert/commit/d4308b1))





## [0.2.2-beta.5](https://github.com/cabasvert/cabasvert/compare/@cabasvert/server@0.2.2-beta.4...@cabasvert/server@0.2.2-beta.5) (2018-10-24)

**Note:** Version bump only for package @cabasvert/server





## [0.2.2-beta.4](https://github.com/cabasvert/cabasvert/compare/@cabasvert/server@0.2.2-beta.3...@cabasvert/server@0.2.2-beta.4) (2018-10-14)

**Note:** Version bump only for package @cabasvert/server





## [0.2.2-beta.3](https://github.com/cabasvert/cabasvert/compare/@cabasvert/server@0.2.2-beta.2...@cabasvert/server@0.2.2-beta.3) (2018-10-14)


### Bug Fixes

* **user:** better report error when unknown user ([28d72e8](https://github.com/cabasvert/cabasvert/commit/28d72e8))


### Features

* **cli:** minimal support for isolated development database ([09fcf50](https://github.com/cabasvert/cabasvert/commit/09fcf50))





## [0.2.2-beta.2](https://github.com/cabasvert/cabasvert/compare/@cabasvert/server@0.2.2-beta.1...@cabasvert/server@0.2.2-beta.2) (2018-10-10)

**Note:** Version bump only for package @cabasvert/server





## [0.2.2-beta.1](https://github.com/cabasvert/cabasvert/compare/@cabasvert/server@0.2.2-beta.0...@cabasvert/server@0.2.2-beta.1) (2018-10-10)

**Note:** Version bump only for package @cabasvert/server





## [0.2.2-beta.0](https://github.com/cabasvert/cabasvert/compare/@cabasvert/server@0.2.1...@cabasvert/server@0.2.2-beta.0) (2018-10-10)

**Note:** Version bump only for package @cabasvert/server




<a name="0.2.1"></a>
## [0.2.1](/compare/@cabasvert/server@0.2.1...@cabasvert/server@0.2.1) (2018-10-06)


### Bug Fixes

* **api:** prefix server apis with /api 9271842
* **confirm:** use full post and check request data 39558dc
* **database:** correctly update user metadata 4239b38
* **database:** logIn/logOut at each request 201f9bb
* **email:** fix smtp credentials configuration and 'from' address cbee182
* **errors:** enhance error management and reporting bb971dd
* **mail:** better handle smtp transport configuration 6e02337
* **mail:** fix url in sent mail 38b0b63
* **mail:** make a complete mail text not viewable as spam fec6075
* **package:** update inversify-express-utils to version 6.0.0 c4f57a1
* **startup:** fix startup to not crash if db url is not responding 17d2c65


### Features

* **cli:** add a bin definition 4727ebc
* **config:** add cli option to generate client application config 881dd32
* **config:** read config from a config file db2dc89
* **cors:** enable CORS headers 52965fc
* **errors:** log internal errors 0dd1cb1
* **logs:** add more debugging messages of actions or problems b9e19f3
* **status:** add a status check controller at /status/check 7498ac4
* **token:** clear token after request with expired/invalid token bb09994
