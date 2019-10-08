module.exports = function(config) {
  process.env.CHROME_BIN = require("puppeteer").executablePath(); // eslint-disable-line
  console.log({ CHROME_BIN: process.env.CHROME_BIN }); // eslint-disable-line

  config.set({
    browsers: [
      // "Chrome_without_security",
      "HeadlessChrome"
    ],
    customLaunchers: {
      HeadlessChrome: {
        base: "ChromeHeadless",
        flags: ["--no-sandbox"]
      },
      Chrome_without_security: {
        base: "Chrome",
        flags: ["--disable-web-security", "--disable-site-isolation-trials"]
      }
    },

    basePath: "",
    port: 9877,
    colors: true,
    logLevel: "INFO",
    autoWatch: false,

    singleRun: true,
    frameworks: ["qunit"],
    reporters: ["progress"],
    files: [
      "test/vendor/object-assign-polyfill.js",
      "test/vendor/prototype-bind-polyfill.js",
      "test/vendor/bluebird.js",
      "test/vendor/jquery.min.js",
      "test/vendor/underscore.js",
      "dist/ig_backbone.bundle.js",
      "test/ig_backbone/setup/*.js",
      "test/ig_backbone/*.js"
    ]
  });
};
