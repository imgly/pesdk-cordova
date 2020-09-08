const fs = require("fs");
const path = require("path");

module.exports = (context) => {
  "use strict";

  return new Promise((resolve, reject) => {
    const projectRoot = path.join(context.opts.projectRoot);
    var gradleConfigFile = path.join(projectRoot, "imglyConfig.gradle");
    fs.unlink(gradleConfigFile, (err) => {
      console.log("imglyConfig.gradle was deleted");
      resolve();
    });
  });
};
