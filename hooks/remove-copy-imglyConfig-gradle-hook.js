const fs = require("fs");
const path = require("path");
const async = require("async");

module.exports = (context) => {
  "use strict";
  const BLOCK_START = `// imglyConfig ADDED BY IMGLY - BLOCK START`;
  const BLOCK_END = `// imglyConfig ADDED BY IMGLY - BLOCK END`;

  return new Promise((resolve, reject) => {
    const platformRoot = path.join(
      context.opts.projectRoot,
      "platforms/android/app"
    );

    var gradleFiles = [path.join(platformRoot, "build.gradle")];

    async.each(
      gradleFiles,
      function (file, callback) {
        let fileContents = fs.readFileSync(file, "utf8");

        let found = fileContents.indexOf("imglyConfig");

        if (found !== -1) {
          // found
          var toRemove = fileContents.substring(
            fileContents.indexOf(BLOCK_START),
            fileContents.lastIndexOf(BLOCK_END) + BLOCK_END.length
          );
          fileContents = fileContents.replace(toRemove, "");

          fs.writeFileSync(file, fileContents, "utf8");
          console.log("remove imglyConfig from " + file);

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
