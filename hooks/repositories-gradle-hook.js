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
        google()
        gradlePluginPortal()
        maven { url "https://plugins.gradle.org/m2/" }
        maven { url "https://artifactory.img.ly/artifactory/imgly" }` +
    "\n" +
    BLOCK_END +
    "\n";

  const platformRoot = path.join(
    context.opts.projectRoot,
    "platforms/android"
  );

  // const gradleFiles = findGradleFiles(platformRoot);
  // We need to check both locations since from cordova v.10.* a dedicated `repositories.gradle` file
  // is generated.
  const gradleFiles = [path.join(platformRoot, "build.gradle"), path.join(platformRoot, "repositories.gradle")];

  return gradleFiles.forEach((file) => {
    // We need to check whether the file really exists, 
    // else it will throw an error for Cordova < v.10.0.0.
    if (!fs.existsSync(file)) {
      return;
    }

    let fileContents = fs.readFileSync(file, "utf8");
    let found = fileContents.indexOf(
      'maven { url "https://artifactory.img.ly/artifactory/imgly" }'
    );

    if (found === -1) {
      // The artifactory repository reference has NOT been found.
      let insertLocations = [];

      // The regex differs for the different gradle files.
      const myRegexp = file == gradleFiles[0] ? /\brepositories\s*{(.*)$/gm : /\bext.repos\s=\s*{(.*)$/gm;
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
        console.log("Updated " + file + " to include img.ly repositories.");
        return;
      }
    };
  });
};
