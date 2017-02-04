var fs = require('fs');

module.exports = function(context) {
  copyFiles('./config/build-extras.gradle', './platforms/android/build-extras.gradle');
  console.log("Copied './config/build-extras.gradle' file to './platforms/android/'.");

  // Recusive copy function for res/native processing
  function copyFiles(srcPath, destPath) {
    if (fs.statSync(srcPath).isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath);
      }
      fs.readdirSync(srcPath).forEach(function (child) {
        copyFiles(path.join(srcPath, child), path.join(destPath, child));
      });
    } else {
      fs.writeFileSync(destPath, fs.readFileSync(srcPath));
    }
  }
};
