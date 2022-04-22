const fs = require("fs");
const path = require("path");
const async = require("async");

module.exports = (context) => {
  "use strict";

  const BLOCK_START = `        // DEPENDENCIES ADDED BY IMGLY - BLOCK START`;
  const BLOCK_END = `        // DEPENDENCIES ADDED BY IMGLY - BLOCK END`;
  const VERSION_BLOCK_START = "// VERSION CHANGED BY IMGLY - START - ";
  const VERSION_BLOCK_END = "// VERSION CHANGED BY IMGLY - END -";
  const gradlePluginVersion = '1.4.10';

  const imglyDependencies =
    "\n" +
    BLOCK_START +
    `
        classpath "ly.img.android.sdk:plugin:9.2.0"` +
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
              const version = versionMatch[0].replace("ext.kotlin_version = ", "");
              const newVersion = `${VERSION_BLOCK_START + version}\n    ext.kotlin_version = '${gradlePluginVersion}'\n    ${VERSION_BLOCK_END}`;
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
