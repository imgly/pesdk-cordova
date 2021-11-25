const fs = require("fs");
const path = require("path");
const async = require("async");

module.exports = (context) => {
  "use strict";
  const BLOCK_START = `// REPOSITORIES ADDED BY IMGLY - BLOCK START`;
  const BLOCK_END = `// REPOSITORIES ADDED BY IMGLY - BLOCK END`;

  return new Promise((resolve, reject) => {
    const platformRoot = path.join(
      context.opts.projectRoot,
      "platforms/android"
    );

    var gradleFiles = [path.join(platformRoot, "build.gradle"), path.join(platformRoot, "repositories.gradle")];

    async.each(
      gradleFiles,
      function (file, callback) {
        // We need to check whether the file really exists, 
        // else it will throw an error for Cordova Android < 9.1.0
        // since the `repositories.gradle` file will not be found.
        if (!fs.existsSync(file)) {
          return;
        }
        let fileContents = fs.readFileSync(file, "utf8");

        let found = fileContents.indexOf(
          'maven { url "https://artifactory.img.ly/artifactory/imgly" }'
        );

        if (found !== -1) {
          // found
          var toRemove = fileContents.substring(
            fileContents.indexOf(BLOCK_START),
            fileContents.lastIndexOf(BLOCK_END) + BLOCK_END.length
          );
          fileContents = fileContents.replace(toRemove, "");

          fs.writeFileSync(file, fileContents, "utf8");
          console.log("remove imgly repositories from " + file);

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
