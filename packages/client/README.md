# Cabas Vert client

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

1. Ensure that every libraries are compiled by running **in the root directory**:
```bash
yarn compile
```

2. Then [run a server and a database instance](https://github.com/cabasvert/cabasvert/tree/master/packages/server#serve) in another terminal.

3. Edit the `src/config.dev.json`, if necessary.

4. Finally, run the browser version of the client app by running:
```bash
yarn start
```

## Test

1. Ensure that every libraries are compiled by running **in the root directory**:
```bash
yarn compile
```

2. Run
```bash
yarn test
```

## Build

Ensure that every libraries are compiled by running **in the root directory**:
```bash
yarn compile
```

### Browser Release Build

Run `yarn run build-browser-release`.
This will make a production build in `www/` and also pack it in `artifacts/`.

You can start a webserver (mainly to test the service worker)
  by running `(cd www && http-server)`.

### Android Debug Build

Run `yarn run build-android-debug`.
The result will be in `artifacts/`.

To deploy on your device connected via USB,
  run `yarn run deploy-android-debug`.

### Android Release Build

First, configure the `android/keystore.properties` file to include the release signing information:
```
storeFile=<path-to>/.keystores/android-cabasvert.jks
storeType=jks
keyAlias=upload
storePassword=<storePassword>
keyPassword=<keyPassword>
```

Run `yarn run build-android-release`.
The result will be in `artifacts/`.

To deploy on your device connected via USB,
  run `npm run deploy-android-release`.
