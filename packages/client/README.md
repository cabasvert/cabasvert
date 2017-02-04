# Serve

Run `NODE_ENV=prod ionic serve`.

# Browser Builds

Run `NODE_ENV=prod ionic cordova build browser --prod`.

The result is in `platform/browser/www/`.

# Android Builds

## Debug Builds

Run `NODE_ENV=prod ionic cordova build android --prod`.

The result is in `platform/android/builds/output/apk/`.

## Release Builds

1. Configure the `platforms/android/release-signing.properties` file to include the release signing information:
```
storeFile=<path-to>/.keystores/android-cabasvert.jks
storeType=jks
keyAlias=upload
storePassword=<storePassword>
keyPassword=<keyPassword>
```

2. Check there is no `android:debuggable` attribute on the `application` tag in the `platforms/android/AndroidManifest.xml`
file.

3. Run `NODE_ENV=prod ionic cordova build android --prod --release`.

The result is in `platform/android/builds/output/apk/`.
