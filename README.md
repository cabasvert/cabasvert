# Cabas Vert

[![Build Status](https://travis-ci.org/cabasvert/cabasvert.svg?branch=master)](https://travis-ci.org/cabasvert/cabasvert)
[![Greenkeeper badge](https://badges.greenkeeper.io/cabasvert/cabasvert.svg)](https://greenkeeper.io/)
[![codecov](https://codecov.io/gh/cabasvert/cabasvert/branch/master/graph/badge.svg)](https://codecov.io/gh/cabasvert/cabasvert)

<table>
  <tr>
    <td width="150px">
      <img alt="Cabas Vert logo" valign="top" title="Cabas Vert logo"
           src="https://raw.githubusercontent.com/cabasvert/cabasvert/master/docs/img/icon.svg?sanitize=true"/>
    </td>
    <td>
      <p>
        <b>Cabas Vert</b> is a management application for associations that participate in the distribution of organic, local and seasonal, vegetable baskets.
        It is used by our association in Marseille (France) but aims to be used by other AMAPs (Associations for the Maintenance of Family Farming).
      </p>
      <p>
        <b>Cabas Vert</b> is a Free Sotware and is distributed under the GPL v3.0 licence.
      </p>
    </td>
  </tr>
</table>

## Setup

```bash
yarn install
```

This will install all the dependencies and bootstrap the whole project.

## Compile

```bash
yarn compile
```

## Test

```bash
yarn test
```

You will find additional information in the `README.md` files of the
    [server](https://github.com/cabasvert/cabasvert/tree/master/packages/server#test) and
    [client](https://github.com/cabasvert/cabasvert/tree/master/packages/client#test) packages.

## Build

```bash
yarn build
```

You will find additional information in the `README.md` files of the
    [client](https://github.com/cabasvert/cabasvert/tree/master/packages/client#build) package.

## Package Maintenance

### Make a release

Run one of the following, and validate new version choices.

```bash
yarn run release:alpha
# or
yarn run release:beta
# or
yarn run release:rc
# or
yarn run release
```

This will run a check phase (lint, license-check, test) and build all the artifacts.
If everything goes on well, version bumps will be computed depending on the commits since the last release.
Changelogs will be generated and commit along some new version tags.

The new commit and tags are automatically pushed to the repository.

### Publish a release

Finally, you have to publish the release and corresponding artifacts to the repository.

```bash
yarn run publish-release
```
