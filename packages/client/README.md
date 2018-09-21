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

Run `npm run start`.

### Browser Builds

Run `npm run build`.

The result is in `www/`.

### Android Builds

#### Debug Builds

1. Run `ionic build --prod && ionic cap sync && ionic cap open android`.

2. Build in Android Studio

The result is in `android/builds/output/apk/`.

#### Release Builds

1. Configure the `android/release-signing.properties` file to include the release signing information:
```
storeFile=<path-to>/.keystores/android-cabasvert.jks
storeType=jks
keyAlias=upload
storePassword=<storePassword>
keyPassword=<keyPassword>
```

2. Check there is no `android:debuggable` attribute on the `application` tag in the `platforms/android/AndroidManifest.xml`
file.

3. Run `ionic build --prod --release && ionic cap sync && ionic cap open android`.

4. Build and sign in Android Studio 

The result is in `platform/android/builds/output/apk/`.
