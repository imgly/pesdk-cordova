const fs = require("fs");
const path = require("path");
const async = require("async");

module.exports = (context) => {
  "use strict";

  const BLOCK_START = `        // DEPENDENCIES ADDED BY IMGLY - BLOCK START`;
  const BLOCK_END = `        // DEPENDENCIES ADDED BY IMGLY - BLOCK END`;
  const VERSION_BLOCK_START = "// VERSION CHANGED BY IMGLY - START - ";
  const VERSION_BLOCK_END = "// VERSION CHANGED BY IMGLY - END -";

  return new Promise((resolve, reject) => {
    const platformRoot = path.join(
      context.opts.projectRoot,
      "platforms/android"
    );

    var gradleFiles = [path.join(platformRoot, "build.gradle")];

    async.each(
      gradleFiles,
      function (file, callback) {
        let fileContents = fs.readFileSync(file, "utf8");

        let found = fileContents.indexOf("ly.img.android.sdk:plugin");

        if (found !== -1) {
          // found
          var toRemove = fileContents.substring(
            fileContents.indexOf(BLOCK_START),
            fileContents.lastIndexOf(BLOCK_END) + BLOCK_END.length
          );
          fileContents = fileContents.replace(toRemove, "");
          
          
          const regex = /VERSION CHANGED BY IMGLY - START - '([0-9]*).([0-9]*).([0-9]*)'/gm;
          const versionMatch = regex.exec(fileContents);
          const version = versionMatch[0].replace("VERSION CHANGED BY IMGLY - START - ", "");
          const kotlinVersion = fileContents.substring(fileContents.indexOf(VERSION_BLOCK_START), fileContents.indexOf(VERSION_BLOCK_END) + VERSION_BLOCK_END.length);
          fileContents = fileContents.replace(kotlinVersion, `ext.kotlin_version = ${version}`);
          fs.writeFileSync(file, fileContents, "utf8");
          console.log("remove imgly dependencies from " + file);
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
