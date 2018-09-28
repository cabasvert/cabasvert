# Cabas Vert client

<table>
  <tr>
    <td width="150px">
      <img alt="Cabas Vert logo" valign="top" title="Cabas Vert logo"
           src="https://raw.githubusercontent.com/cabasvert/cabasvert-client/master/docs/img/icon.svg?sanitize=true"/>
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

## Building

### Serve

Run `npm start`.

### Browser Builds

#### Release build

1. Run `npm run build-production`. The result will be in `www/`.

2. Run `(cd www && http-server)`.

#### Make a release and publish to GitHub

Add `-p beta` (or `alpha`, or `rc`) to the `npm release` below if necessary.

1. First, do a release build and check that everything runs smoothly.

2. Run `npm release -- --dry-run` to dry run the release.

3. Run `npm release`

4. Run `git push --follow-tags`.

5. Run `npm run publish-release` to publish to GitHub.

### Android Builds

#### Debug Builds

Run `npm run build-android-debug`.
The result will be in `android/app/build/outputs/apk/debug/`.

To build and deploy on your device connected via USB, run `npm run install-android-debug`.

#### Release Builds

First, configure the `android/keystore.properties` file to include the release signing information:
```
storeFile=<path-to>/.keystores/android-cabasvert.jks
storeType=jks
keyAlias=upload
storePassword=<storePassword>
keyPassword=<keyPassword>
```

Run `npm run build-android-release`.
The result will be in `android/app/build/outputs/apk/release/`.

To build and deploy on your device connected via USB, run `npm run install-android-release`.
