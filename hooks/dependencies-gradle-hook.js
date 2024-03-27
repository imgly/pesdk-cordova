const fs = require("fs");
const path = require("path");
const async = require("async");

module.exports = (context) => {
  "use strict";

  const BLOCK_START = `        // DEPENDENCIES ADDED BY IMGLY - BLOCK START`;
  const BLOCK_END = `        // DEPENDENCIES ADDED BY IMGLY - BLOCK END`;
  const VERSION_BLOCK_START = "// VERSION CHANGED BY IMGLY - START - ";
  const VERSION_BLOCK_END = "// VERSION CHANGED BY IMGLY - END -";
  const gradlePluginVersion = '1.7.21';
  var sdkVersion = "10.9.0";
  var kspVersion = "1.7.21-1.0.8";

  try {
    const configFilePath = path.join(
      context.opts.projectRoot,
      "imglyConfig.json"
    );
    const config = fs.readFileSync(configFilePath, "utf8");
    if (config != null) {
      const configJson = JSON.parse(config);
      const configVersion = configJson.version;
      const configKspVersion = configJson.kspVersion;
      if (configVersion != null) sdkVersion = configVersion;
      if (configKspVersion != null) kspVersion = configKspVersion;
    }
  } catch {
    console.log(
      "Warning: There is no imglyConfig.json file in your root directory. Consider adding it to customize the IMG.LY Android SDK integration."
    );
  }

  const imglyDependencies =
    "\n" +
    BLOCK_START +
    `
        classpath "com.google.devtools.ksp:com.google.devtools.ksp.gradle.plugin:${kspVersion}"
        classpath "ly.img.android.sdk:plugin:${sdkVersion}"` +
    "\n" +
    BLOCK_END +
    "\n";
  return new Promise((resolve, reject) => {
    const platformRoot = path.join(
      context.opts.projectRoot,
      "platforms/android"
    );

    // const gradleFiles = findGradleFiles(platformRoot);
    var gradleFiles = [path.join(platformRoot, "build.gradle")];

    async.each(
      gradleFiles,
      function (file, callback) {
        let fileContents = fs.readFileSync(file, "utf8");

        let found = fileContents.indexOf("ly.img.android.sdk:plugin");

        if (found === -1) {
          // not found
          let insertLocations = [];
          const myRegexp = /\bdependencies\s*{(.*)$/gm;
          let match = myRegexp.exec(fileContents);
          while (match != null) {
            insertLocations.push(match.index + match[0].length);
            match = null; // just modify the first `repositories` tag
          }

          if (insertLocations.length > 0) {
            insertLocations.reverse(); // process locations end -> beginning
            // to preserve indices
            insertLocations.forEach((location) => {
              fileContents =
                fileContents.substr(0, location) +
                imglyDependencies +
                fileContents.substr(location);
            });

            const regex = /ext.kotlin_version = '([0-9]*).([0-9]*).([0-9]*)'/gm;
            const versionMatch = regex.exec(fileContents);

            if (versionMatch != null) {
              const version = versionMatch[0].replace(
                "ext.kotlin_version = ",
                ""
              );
              const newVersion = `${
                VERSION_BLOCK_START + version
              }\n    ext.kotlin_version = '${gradlePluginVersion}'\n    ${VERSION_BLOCK_END}`;
              fileContents = fileContents.replace(regex, newVersion);
            }
            fs.writeFileSync(file, fileContents);
            console.log("updated " + file + " to include imgly dependencies ");
          }
          callback();
        } else {
          callback();
        }
      },
      function (err) {
        if (err) {
          console.error("unable to update gradle files", err);
          reject();
        } else {
          resolve();
        }
      }
    );
  });
};
