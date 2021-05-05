var PESDK = {
  /**
   * Modally present a photo editor.
   *
   * @param {function} success - The callback returns a `PhotoEditorResult` or `null` if the editor
   * is dismissed without exporting the edited image.
   * @param {function} failure - The callback function that will be called when an error occurs.
   * @param {string} image The source of the image to be edited.
   * Can be a local or remote URI. Local URIs are recommended as the handling of remote URIs is not optimized.
   * Remote resources should be downloaded in advance and then passed to the editor as local resources.
   * Static local resources which reside, e.g., in the `www` folder of your app, should be resolved by 
   * `PESDK.resolveStaticResource("www/path/to/your/image")` before they can be passed to the editor.
   * If this parameter is `null`, the `serialization` parameter must not be `null` and it must contain 
   * an embedded source image.
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
   * @param {string} license The path of the license used to unlock the SDK.
   * The license files should be located within the `www` folder and must have
   * the extension `.ios` for iOS and `.android` for Android. In this way the 
   * licenses get automatically resolved for each platform so that no file-
   * extension is needed in the path.
   * 
   * @example 
   * // Both licenses `pesdk_license.ios` and `pesdk_license.android` 
   * // located in `www/assets/` will be automatically resolved by:
   * PESDK.unlockWithLicense('www/assets/pesdk_license')
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
   * Resolves the path of a static local resource.
   *
   * @param {string} path The path of the static local resource.
   * @returns {string} The platform-specific path for a static local resource that can be accessed by the native PhotoEditor SDK plugin.
   */
  resolveStaticResource: function (path) {
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
  /**
   * @deprecated Use `PESDK.resolveStaticResource` instead.
   * Resolves the path of a static local resource.
   *
   * @param {string} path The path of the static local resource.
   * @returns {string} The platform-specific path for a static local resource that can be accessed by the native PhotoEditor SDK plugin.
   */
  loadResource: function (path) {
    return this.resolveStaticResource(path);
  },
};
module.exports = PESDK;
