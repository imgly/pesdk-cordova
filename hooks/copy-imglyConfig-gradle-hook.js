const fs = require("fs");
const path = require("path");
const async = require("async");

module.exports = (context) => {
  "use strict";

  return new Promise((resolve, reject) => {
    const BLOCK_START = `// imglyConfig ADDED BY IMGLY - BLOCK START`;
    const BLOCK_END = `// imglyConfig ADDED BY IMGLY - BLOCK END`;

    // The content of the gradle file in the cordova app root
    const projectRoot = path.join(context.opts.projectRoot);
    var gradleConfigFile = path.join(projectRoot, "imglyConfig.gradle");
    var imglyConfig = "";
    try {
      imglyConfig = fs.readFileSync(gradleConfigFile, "utf8");
    } catch (err) {
      console.log(err);
      reject();
    }

    // The content of the android app gradle file
    const platformRoot = path.join(
      context.opts.projectRoot,
      "platforms/android/app"
    );
    var gradleFiles = [path.join(platformRoot, "build.gradle")];

    async.each(
      gradleFiles,
      function (file, callback) {
        let fileContents = fs.readFileSync(file, "utf8");
        fileContents =
          fileContents +
          BLOCK_START +
          imglyConfig +
          BLOCK_END
        fs.writeFileSync(file, fileContents, "utf8");
        console.log("updated " + file + " to include imglyConfig");
        callback();
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
