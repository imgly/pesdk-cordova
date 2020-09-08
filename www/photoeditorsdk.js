var PESDK = {
  /**
   * Present a photo editor.
   * @note EXIF meta data is only preserved in the edited image if and only if the source
   * image is loaded from a local `file://` resource.
   *
   * @param {function} success - The callback returns a `PhotoEditorResult` or `null` if the editor
   * is dismissed without exporting the edited image.
   * @param {function} failure - The callback function that will be called when an error occurs.
   * @param {string} image The source of the image to be edited.
   * @param {object} configuration The configuration used to initialize the editor.
   * @param {object} serialization The serialization used to initialize the editor. This
   * restores a previous state of the editor by re-applying all modifications to the loaded
   * image.
   */
  openEditor: function (success, failure, image, configuration, serialization) {
    var options = {};
    options.path = image;
    if (configuration != null) {
      options.configuration = configuration;
    }
    if (serialization != null) {
      options.serialization = serialization;
    }
    cordova.exec(success, failure, "PESDK", "present", [options]);
  },
  
  /**
   * Unlock PhotoEditor SDK with a license.
   *
   * The license should have an extension like this:
   * for iOS: "xxx.ios", example: pesdk_license.ios
   * for Android: "xxx.android", example: pesdk_license.android
   * then pass just the name without the extension to the `unlockWithLicense` function.
   * @example `PESDK.unlockWithLicense('www/assets/pesdk_license')`
   *
   * @param {string} license The path of license used to unlock the SDK.
   */
  unlockWithLicense: function (license) {
    var platform = window.cordova.platformId;
    if (platform == "android") {
      license += ".android";
    } else if (platform == "ios") {
      license = "imgly_asset:///" + license + ".ios";
    }
    cordova.exec(null, null, "PESDK", "unlockWithLicense", [license]);
  },
  /**
   * Get the correct path to each platform
   * It can be used to load local resources
   *
   * @param {string} path The path of the local resource.
   * @returns {string} assets path to deal with it inside PhotoEditor SDK
   */
  loadResource: function (path) {
    var platform = window.cordova.platformId;
    if (platform == "android") return "asset:///" + path;
    else if (platform == "ios") {
      var tempPath = "imgly_asset:///" + path;
      return tempPath;
    }
  },
  getDevice: function () {
    return window.cordova.platformId;
  },
};
module.exports = PESDK;
