'use strict';

module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-run');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-express-server');

  // Project configuration.
  grunt.initConfig({
    express: {
      options: {
        port: 54815,
        output: 'Test Server running on.*'
        // Override defaults here
      },
      test: {
        options: {
          script: 'node_modules/ec.appcms-mock.js/server.js'
        }
      }
    },
    run: {
      coverage: {
        exec: 'istanbul cover _mocha -- --recursive -R spec '
      },
      browserify: {
        exec: 'browserify -r ./index.js:ec.datamanager.js -s DataManager -o ./build/datamanager.js'
      }
    },
    uglify: {
      datamanagerjs: {
        files: {
          './build/datamanager.js': ['./build/datamanager.js']
        }
      }
    },
    browserify: {
      datamanagerjs: {
        files: {
          './build/datamanager.js': ['./index.js']
        },
        options: {
          alias: {
            'ec.datamanager.js': './index.js'
          },
          browserifyOptions: {
            standalone: 'DataManager'
          }
        }
      }
    },
    mochaTest: {
      test: {
        src: ['test/*.js']
      }
    },
    karma: {
      test: {
        configFile: 'karma.conf.js'
      }
    }
  });

  // Default task(s).
  grunt.registerTask('mockserver', ['express:test']);
  grunt.registerTask('mockserver-stop', ['express:test:stop']);
  grunt.registerTask('test-backend', 'mochaTest');
  grunt.registerTask('test-frontend', ['build', 'mockserver', 'karma:test', 'mockserver-stop']);
  //grunt.registerTask('test-frontend', ['mockserver', 'karma:test', 'mockserver-stop']);
  grunt.registerTask('build', ['run:browserify', 'uglify']);
  //grunt.registerTask('build', ['run:browserify']);
  grunt.registerTask('test', ['test-backend', 'test-frontend']);
};