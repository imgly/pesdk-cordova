## [UNRELEASED]

## [3.4.0]

### Changed

* [Android] 🚨 With this version you will need to specify a suitable KSP depending on the Kotlin version you are using. Please visit our guide [here](https://github.com/imgly/pesdk-cordova/blob/master/README.md#ksp). 
* [Android] Raised minimum PhotoEditor SDK for Android version to 10.9.0.
* [iOS] 🚨 Bumped iOS deployment target to 13.0.
* [iOS] Raised minimum PhotoEditor SDK for iOS version to 11.8.

## [3.3.0]

### Added

* Added option to specify the version of the native PhotoEditor SDK for Android version via a `imglyConfig.json` file. See the [README](https://github.com/imgly/pesdk-cordova/blob/master/README.md#version) for more information.

## [3.2.0]

### Changed

* 🚨 With this version you might need to create symlinks when using Android Gradle Plugin version `4.x`. Please refer to the new [known issues](https://github.com/imgly/pesdk-cordova#known-issues) section of the README for details.
* 🚨 This version requires `minSdkVersion` `21` for Android. Please refer to the new "Supported Android versions" section in the [getting started](https://github.com/imgly/pesdk-cordova#android) section of the README for instructions on how to adjust it.
* Raised minimum PhotoEditor SDK for Android version to 10.1.1. See the [changelog](https://github.com/imgly/pesdk-android-demo/blob/master/CHANGELOG.md) for more information.

### Fixed

* Fixed `PESDK.openEditor` `success` callback type declaration to return `PhotoEditorResult | null` instead of just `PhotoEditorResult`.

## [3.1.0]

### Changed

* Updated documentation for remote resources used in the editor. Remote resources are usable but not optimized and therefore should be downloaded in advance and then passed to the editor as local resources.

### Added

* Added integration and documentation for custom watermark.

### Fixed

* [Android] Fixed hook execution would fail for `cordova-android` version 10.0+.

## [3.0.0]

### Changed

* [Android] Migrated the plugin to AndroidX.
* Aligned emoji support for iOS and Android. Emoji support is not optimized for cross-platform use and disabled by default. Added option `configuration.text.allowEmojis` to opt in.

## [2.2.0]

### Added

* Added `configuration.export.force` which will force the photo to be rendered and exported in the defined output format even if no changes have been applied. Otherwise, the input asset will be passed through and might not match the defined output format.

### Fixed

* [iOS] Fixed issue where the plugin result would not be sent.

### Changed

* [Android] Removed `WRITE_EXTERNAL_STORAGE` permission request when opening the editor.

## [2.1.0]

### Fixed

* [iOS] Fixed `export.image.exportType` configuration option.
* [Android] Fixed compiling issues with `compileSdkVersion` 30. 

## [2.0.0]

### Changed

* Improved API documentation.
* Deprecated `PESDK.loadResource` - use `PESDK.resolveStaticResource` instead.
* Updated minimum `cordova` version to 9.0.0.
* [Android] Updated native SDK to version 8.
* [Android] Updated minimum `cordova-android` version to 9.0.0.
* [iOS] Updated minimum `cordova-ios` version to 5.0.1.

## [1.1.0]

### Changed

* Updated identifier documentation for replaced and new fonts.

### Fixed

* [iOS] Fixed compiler warnings.
* [Android] Fixed Android 11 ScopedStorage problems with `targetSdkVersion` 29.
* [Android] Fixed gradle hooks not working properly for Cordova Android 9.1+.

## [1.0.2]

### Fixed

* [Android] Fixed `imglyConfig.gradle` overwrite issue.

## [1.0.0]

### Added

* Initial release of the Cordova plugin for PhotoEditor SDK.
