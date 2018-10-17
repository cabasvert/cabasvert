# Cabas Vert server

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

## Serve

The easiest root is using Docker.

### With your own database

1. Ensure that every libraries are compiled by running **in the root directory**:
```bash
yarn compile
```

2. Edit the `config.json` according to your wishes.

3. Launch a clean CouchDB instance, accessible at `http://localhost:5984`,
    with already setup `_users` and `cabasvert` databases.

4. Then execute:
```bash
yarn start
```
You can use the `DATABASE_HOST` environment variable
  to specify another URL than `http://localhost:5984` for the database.

### With a database run on Docker

1. Ensure that every libraries are compiled by running **in the root directory**:
```bash
yarn compile
```

2. Edit the `config.json` according to your wishes.

3. Start your docker daemon.

4. Then execute:
```bash
DATABASE=couchdb:latest yarn start
```

## Test

The easiest root is using Docker.

### With your own database

1. Ensure that every libraries are compiled by running **in the root directory**:
```bash
yarn compile
```

2. Launch a clean CouchDB instance, accessible at `http://localhost:5984`,
    with already setup `_users` and `cabasvert` databases.

3. Then execute:
```bash
yarn test
```
You can use the `DATABASE_HOST` environment variable
  to specify another URL than `http://localhost:5984` for the database.

Test coverage is automatically generated in a `coverage` directory.

### With a database run on Docker

1. Ensure that every libraries are compiled by running **in the root directory**:
```bash
yarn compile
```

2. Start your docker daemon.

3. Then execute:
```bash
DATABASE=couchdb:latest yarn test
```

Test coverage is automatically generated in a `coverage` directory.
