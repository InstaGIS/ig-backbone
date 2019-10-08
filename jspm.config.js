SystemJS.config({
  browserConfig: {
    "paths": {
      "npm:": "/jspm_packages/npm/",
      "github:": "/jspm_packages/github/"
    }
  },
  nodeConfig: {
    "paths": {
      "npm:": "jspm_packages/npm/",
      "github:": "jspm_packages/github/"
    }
  },
  devConfig: {
    "map": {
      "fs": "npm:jspm-nodelibs-fs@0.2.1",
      "path": "npm:jspm-nodelibs-path@0.2.3",
      "process": "npm:jspm-nodelibs-process@0.2.1",
      "backbone": "github:huasofoundries/backbone_es6@1.0.0"
    }
  },
  transpiler: "plugin-babel",
  paths: {
    "jquery": "test/vendor/jquery.js",
    "underscore": "test/vendor/underscore.js"
  },
  meta: {
    "dist/**/*.js": {
      "build": false
    },
    "dist/*.js": {
      "build": false
    },
    "test/vendor/*": {
      "build": false
    }
  },
  packages: {
    "src": {
      "main": "ig_backbone.js",
      "defaultExtension": false,
      "meta": {
        "*.js": {
          "loader": "plugin-babel"
        }
      }
    }
  }
});

SystemJS.config({
  packageConfigPaths: [
    "npm:@*/*.json",
    "npm:*.json",
    "github:*/*.json"
  ],
  map: {
    "plugin-babel": "npm:systemjs-plugin-babel@0.0.25"
  },
  packages: {}
});
