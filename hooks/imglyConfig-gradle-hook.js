const fs = require("fs");
const path = require("path");
const async = require("async");

module.exports = (context) => {
  "use strict";

  const imglyConfig = `
// Comment out the modules you don't need, to save size.
imglyConfig {
    modules {
        include 'ui:text'
        include 'ui:focus'
        include 'ui:frame'
        include 'ui:brush'
        include 'ui:filter'
        include 'ui:sticker'
        include 'ui:overlay'
        include 'ui:transform'
        include 'ui:adjustment'
        include 'ui:text-design'
        include 'ui:video-trim' // for VideoEditor

        // This module is big, remove the serializer if you don't need that feature.
        include 'backend:serializer'

        // Remove the asset packs you don't need, these are also big in size.
        include 'assets:font-basic'
        include 'assets:frame-basic'
        include 'assets:filter-basic'
        include 'assets:overlay-basic'
        include 'assets:sticker-shapes'
        include 'assets:sticker-emoticons'
        include 'assets:sticker-animated' // for VideoEditor

        include 'backend:sticker-animated' // for VideoEditor
        include 'backend:sticker-smart'
    }
}
`;
  return new Promise((resolve, reject) => {
    const projectRoot = path.join(context.opts.projectRoot);
    var gradleConfigFile = path.join(projectRoot, "imglyConfig.gradle");

    try {
      fs.writeFileSync(gradleConfigFile, imglyConfig);
      console.log("Add imglyConfig.gradle to the root directory.");
      resolve();
    } catch (err) {
      console.error(err);
      reject();
    }
  });
};
