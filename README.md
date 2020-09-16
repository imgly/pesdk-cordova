<p align="center">
  <a href="https://www.photoeditorsdk.com/?utm_campaign=Projects&utm_source=Github&utm_medium=PESDK&utm_content=Cordova"><img src="http://static.photoeditorsdk.com/logo.png" alt="PhotoEditor SDK Logo"/></a>
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

### Android

**Configuration for Android:**
Configure PhotoEditor SDK for Android by opening `imglyConfig.gradle`, you can comment out the modules you don't need to save size.

Because PhotoEditor SDK for Android is quite large, there is a high chance that you will need to enable [Multidex](https://developer.android.com/studio/build/multidex) for your project as follows:

```sh
cordova plugin add cordova-plugin-enable-multidex
```

### Usage

Each platform requires a separate license file. Unlock PhotoEditor SDK with a single line of code for both platforms via platform-specific file extensions.

Rename your license files:
- Android license: `ANY_NAME.android`
- iOS license: `ANY_NAME.ios`

Pass the file path without the extension to the `unlockWithLicense` function to unlock both iOS and Android:
```js
PESDK.unlockWithLicense('www/assets/ANY_NAME');
```

Open the editor with an image:
```js
PESDK.openEditor(
  successCallback,
  failureCallback,
  PESDK.loadResource('www/assets/image.jpg')
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

Make sure you have a [commercial license](https://account.photoeditorsdk.com/pricing/?utm_campaign=Projects&utm_source=Github&utm_medium=PESDK&utm_content=Cordova) for PhotoEditor SDK before releasing your app.
A commercial license is required for any app or service that has any form of monetization: This includes free apps with in-app purchases or ad supported applications. Please contact us if you want to purchase the commercial license.

## Support and License

Use our [service desk](http://support.photoeditorsdk.com) for bug reports or support requests. To request a commercial license, please use the [license request form](https://account.photoeditorsdk.com/pricing/?utm_campaign=Projects&utm_source=Github&utm_medium=PESDK&utm_content=Cordova) on our website.
