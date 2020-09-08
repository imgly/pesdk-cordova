const fs = require("fs");
const path = require("path");
const async = require("async");

module.exports = (context) => {
  "use strict";
  const BLOCK_START = `        // REPOSITORIES ADDED BY IMGLY - BLOCK START`;
  const BLOCK_END = `        // REPOSITORIES ADDED BY IMGLY - BLOCK END`;

  const imglyRepositories =
    "\n" +
    BLOCK_START +
    `
        jcenter()
        maven { url "https://plugins.gradle.org/m2/" }
        maven { url "https://artifactory.img.ly/artifactory/imgly" }` +
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

        let found = fileContents.indexOf(
          'maven { url "https://artifactory.img.ly/artifactory/imgly" }'
        );

        if (found === -1) {
          // not found
          let insertLocations = [];
          const myRegexp = /\brepositories\s*{(.*)$/gm;
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
                imglyRepositories +
                fileContents.substr(location);
            });

            fs.writeFileSync(file, fileContents, "utf8");
            console.log("updated " + file + " to include imgly repositories ");
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
