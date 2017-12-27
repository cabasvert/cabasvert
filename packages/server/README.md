# Cabas Vert server

[![Greenkeeper badge](https://badges.greenkeeper.io/cabasvert/cabasvert-server.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.org/cabasvert/cabasvert-server.svg?branch=master)](https://travis-ci.org/cabasvert/cabasvert-server)

<table>
  <tr>
    <td width="150px">
      <img alt="Cabas Vert logo" valign="top" title="Cabas Vert logo"
           src="https://raw.githubusercontent.com/cabasvert/cabasvert-server/master/docs/img/icon.svg?sanitize=true"/>
    </td>
    <td>
      <p>
        <b>Cabas Vert</b> is a management application for associations that participates to the distribution of organic, local and seasonal, vegetable baskets.
        It is used by our association in Marseille (France) but aims to be used by other AMAPs (Associations for the Maintenance of Family Farming).
      </p>
      <p>
        <b>Cabas Vert</b> is a Free Sotware and is distributed under the GPL v3.0 licence.
      </p>
    </td>
  </tr>
</table>

## Building

Execute:

```bash
npm run build
```

## Running

Copy the `config.json` file to `my-config.json` and edit it according to your wishes.
Then execute:

```bash
npm run build
node dist/cli --config=my-config.json
```

## Testing

Launch a CouchDB instance, accessible at `http://localhost:5984`, in [Admin Party](http://guide.couchdb.org/draft/security.html#party) and with CORS enabled.
Then execute:

```bash
npm run test
```

Test coverage is automatically generated in a `coverage` directory.
