<p align="center">
  <a href="https://img.ly/photo-sdk?utm_campaign=Projects&utm_source=Github&utm_medium=PESDK&utm_content=Cordova"><img src="https://img.ly/static/logos/PE.SDK_Logo.svg" alt="PhotoEditor SDK Logo"/></a>
</p>
<p align="center">
  <a href="https://npmjs.org/package/cordova-plugin-photoeditorsdk">
    <img src="https://img.shields.io/npm/v/cordova-plugin-photoeditorsdk.svg" alt="NPM version">
  </a>
  <img src="https://img.shields.io/badge/platforms-android%20|%20ios-lightgrey.svg" alt="Platform support">
  <a href="http://twitter.com/PhotoEditorSDK">
    <img src="https://img.shields.io/badge/twitter-@PhotoEditorSDK-blue.svg?style=flat" alt="Twitter">
  </a>
</p>

# Cordova & Ionic plugin for PhotoEditor SDK

## Getting started

Add PhotoEditor SDK plugin to your project as follows:

```sh
cordova plugin add cordova-plugin-photoeditorsdk
```

### Known Issues

With version `3.2.0`, we recommend using `compileSdkVersion` not lower than `31` for Android. However, this might interfere with your application's Android Gradle Plugin version if this is set to `4.x`.

If you don't use a newer Android Gradle Plugin version, you'll most likely encounter a build error similar to:

```
FAILURE: Build failed with an exception.

* What went wrong:
A problem occurred configuring project ':cordova-plugin-photoeditorsdk'.
> com.android.builder.errors.EvalIssueException: Installed Build Tools revision 31.0.0 is corrupted. Remove and install again using the SDK Manager.

* Try:
Run with --stacktrace option to get the stack trace. Run with --info or --debug option to get more log output. Run with --scan to get full insights.

* Get more help at https://help.gradle.org
```

As a workaround you can create the following symlinks:

1. Inside `/Users/YOUR-USERNAME/Library/Android/sdk/build-tools/31.0.0/`: Create a `dx` symlink for the `d8` file with `ln -s d8 dx`.
2. From there, go to `./lib/` and create a `dx.jar` symlink for the `d8.jar` file with `ln -s d8.jar dx.jar`.

### Android

#### Version

You can configure the native Android PhotoEditor SDK version used by creating a `imglyConfig.json` file and specifying a specific version:

```json
{
  "version": "10.3.3"
}
```

If no version / no configuration file is specified, the module will use the default minimum required version.

#### KSP

With version `3.2.0` of the PhotoEditor SDK for Cordova, the integration of the native Android PE.SDK has changed. The new minimum Android PE.SDK version is `10.9.0` which requires [Kotlin Symbol Processing (KSP)](https://github.com/google/ksp).
The KSP version depends on the Kotlin version that you are using. In order to find the correct version, please visit the [official KSP release page](https://github.com/google/ksp/releases?page=1).
In order to specify the KSP version, please add an entry to the `imglyConfig.json`:

```json
{
  "kspVersion": "1.7.21-1.0.8"
}
```

By default, version `1.7.21-1.0.8` is used which is suitable for Kotlin `1.7.21`.

#### AndroidX

From version `3.0.0` the plugin uses AndroidX. To enable AndroidX in your application please adjust your `config.xml`:

```diff
<platform name="android">
...
+    <preference name="AndroidXEnabled" value="true" />
...
</platform>
```

If your application is using legacy Android Support Libraries you can use the [`cordova-plugin-androidx-adapter`](https://www.npmjs.com/package/cordova-plugin-androidx-adapter) which will migrate the legacy libraries to work with AndroidX.

#### Kotlin Version

If you are using `cordova-android` version `10.0+`, you might need to adjust the Kotlin version of your application in your `config.xml`, if your current Kotlin version is not compatible with our plugin:

```diff
<platform name="android">
...
+    <preference name="GradlePluginKotlinVersion" value="1.5.32" />
...
</platform>
```

#### Supported Android versions

With version `3.2.0` the plugin requires `minSdkVersion` `21` or higher. Depending on your `cordova-android` version you might need to raise the `minSdkVersion` manually. For this, please add the following entry to your `config.xml`:

```diff
<platform name="android">
...
+    <preference name="android-minSdkVersion" value="21" />
...
</platform>
```

We further recommend you to update your `buildToolsVersion` to `31.0.0` as well as your `compileSdkVersion` to `31`. However, this is not mandatory. For further reference on how to update these variables, please refer to the official [Cordova documentation](https://cordova.apache.org/docs/en/11.x/guide/platforms/android/index.html#configuring-gradle).

#### Modules

You can configure the modules used for the PhotoEditor SDK for Android by opening `imglyConfig.gradle` and removing / commenting out the modules you do not need. This will also reduce the size of your application.

Because PhotoEditor SDK for Android with all its modules is quite large, there is a high chance that you will need to enable [Multidex](https://developer.android.com/studio/build/multidex) for your project as follows:

```sh
cordova plugin add cordova-plugin-enable-multidex
```

### iOS

With version `3.4.0` the plugin requires a deployment target of 13.0+ for iOS. If needed, please update your deployment target inside the `config.xml` as described [here](https://cordova.apache.org/docs/en/latest/config_ref/index.html).

### Usage

Each platform requires a separate license file. Unlock PhotoEditor SDK with a single line of code for both platforms via platform-specific file extensions.

Rename your license files:

- Android license: `ANY_NAME.android`
- iOS license: `ANY_NAME.ios`

Pass the file path without the extension to the `unlockWithLicense` function to unlock both iOS and Android:

```js
PESDK.unlockWithLicense("www/assets/ANY_NAME");
```

Open the editor with an image:

```js
PESDK.openEditor(
  successCallback,
  failureCallback,
  PESDK.resolveStaticResource("www/assets/image.jpg")
);
```

Please see the [code documentation](./types/index.d.ts) for more details and additional [customization and configuration options](./types/configuration.ts).

#### Notes for Ionic framework

- Add this line above your class to be able to use `PESDK`.
  ```js
  declare var PESDK;
  ```
- Ionic will generate a `www` folder that will contain your compiled code and your assets. In order to pass resources to PhotoEditor SDK you need to use this folder.

## Example

Please see our [example project](https://github.com/imgly/pesdk-cordova-demo) which demonstrates how to use the Cordova plugin for PhotoEditor SDK.

## License Terms

Make sure you have a [commercial license](https://img.ly/pricing?utm_campaign=Projects&utm_source=Github&utm_medium=PESDK&utm_content=Cordova) for PhotoEditor SDK before releasing your app.
A commercial license is required for any app or service that has any form of monetization: This includes free apps with in-app purchases or ad supported applications. Please contact us if you want to purchase the commercial license.

## Support and License

Use our [service desk](https://support.img.ly) for bug reports or support requests. To request a commercial license, please use the [license request form](https://img.ly/pricing?utm_campaign=Projects&utm_source=Github&utm_medium=PESDK&utm_content=Cordova) on our website.
