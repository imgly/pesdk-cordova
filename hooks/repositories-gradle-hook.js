const fs = require("fs");
const path = require("path");
const async = require("async");

/** This module adds the repositories for the Android SDK. */
module.exports = (context) => {
  "use strict";
  /** The start indicator for the added repositories. */
  const BLOCK_START = `// REPOSITORIES ADDED BY IMGLY - BLOCK START`;

  /** The end indicator for the added repositories. */
  const BLOCK_END = `// REPOSITORIES ADDED BY IMGLY - BLOCK END`;

  /** The maven repository. */
  const mavenRepository = `maven { url "https://artifactory.img.ly/artifactory/imgly" }`;

  /** The maven repository block for the allprojects buildscript for Android SDK version >= 9.0.0. */
  const mavenRepositoryBlock = "\n        " + BLOCK_START + 
  `
        ${mavenRepository}` + "\n        " + BLOCK_END + "\n";

  /** The root of the android platform. */
  const platformRoot = path.join(
    context.opts.projectRoot,
    "platforms/android"
  );

  /** The repositories for the default buildscript. */
  function imglyRepositories(indention) {
    return "\n" + indention + BLOCK_START + "\n" + indention + 
    `${mavenRepository}` + "\n" + indention + BLOCK_END + "\n";
  }

  /** 
   * The files to add the repositories to.
   * We need to check both locations since from Cordova Android v.9.1.* a dedicated `repositories.gradle` file is generated.
   */
  const gradleFiles = [path.join(platformRoot, "build.gradle"), path.join(platformRoot, "repositories.gradle")];

  return gradleFiles.forEach((file) => {
    // We need to check whether the file really exists, 
    // else it will throw an error for Cordova Android < 9.1.0
    // since the `repositories.gradle` file will not be found.
    if (!fs.existsSync(file)) {
      return;
    }

    let fileContents = fs.readFileSync(file, "utf8");
    let found = fileContents.indexOf(
      mavenRepository
    );

    // Only add the repositories if they have not been added before.
    if (found === -1) {
      let insertLocations = [];

      // The regex differs for the different gradle files.
      const myRegexp = file == gradleFiles[0] ? /\brepositories\s*{(.*)$/gm : /\bext.repos\s=\s*{(.*)$/gm;
      let matches = fileContents.matchAll(myRegexp);
      for (const match of matches) {
        insertLocations.push(match.index + match[0].length);
      }

      if (insertLocations.length > 0) {
        // We need to process the locations reversed in order
        // to preserve indices.
        insertLocations.reverse();

        // Depending on whether we are inserting in the `buildscript` or
        // in the `allprojects` section, we need to adjust the content.
        const buildscript_index = insertLocations.length > 1 ? 1 : 0;
        insertLocations.forEach((location, index) => {
          if (index == buildscript_index) {
            fileContents =
            fileContents.substr(0, location) +
            imglyRepositories(file == gradleFiles[0] ? "        " : "    ") +
            fileContents.substr(location);
          } else {
            fileContents =
            fileContents.substr(0, location) +
            mavenRepositoryBlock +
            fileContents.substr(location);
          }
        });
      } else {
        // If we can not find an insert location we need to add a 
        // new `allprojects` block to add the maven repository.
        fileContents = fileContents + "\n" + BLOCK_START + "\n" + `allprojects {\n  repositories {\n    ${mavenRepository}\n  }\n}` + "\n" + BLOCK_END;
      }
      fs.writeFileSync(file, fileContents, "utf8");
      console.log("Updated " + file + " to include IMG.LY repositories.");
      return;
    };
  });
};
