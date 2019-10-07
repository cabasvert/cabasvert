# Cabas Vert tools

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

## Commands

Get help:
```bash
$ npx cvt --help
Usage: cvt [OPTION]... COMMAND

Commands:
    backup save             Write a backup of database to file
    backup restore <file>   Restores a backup of database from file
    generate                Generates a randomized database
    setup                   Setups database

Common options:
    -l, --location=NAME      Specify the server location
    -H, --host=URL           Specify the database host
    --username=...           Specify an admin username
    --password=...           Specify an admin password
    -d, --db-name=NAME       Specify the database name
    -h, --help               Shows this help message

Server locations:
    You can have location shortcuts in a .cabasvertrc.json file in your
    home directory. It has the following format:

{
  "defaultLocation": "local",
  "locations": {
    "local": {
      "name": "local",
      "database": {
        "url": "http://localhost:3000",
        "auth": {
          "username": "username",
          "password": "password"
        }
      }
    },
    "prod": {
      "name": "prod",
      "database": {
        "url": "https://my-database.com",
        "auth": {
          "username": "my-username",
          "password": "my-password"
        }
      }
    }
  }
}
```

Create the database admin user:
```bash
npx cvt setup
```

Generate a `test` database:
```bash
npx cvt -d test generate
```

Make a backup of the `test` database:
```bash
npx cvt -d test backup save
```

Restore a backup of the `test` database:
```bash
npx cvt -d test backup restore backup-file.json
```

## Build

Execute:

```bash
yarn build
```

## Run

Copy the `config.json` file to `my-config.json` and edit it according to your wishes.
Then execute:

```bash
yarn build
node dist/cli --help
```

## Test

```bash
yarn test
```

Test coverage is automatically generated in a `coverage` directory.
