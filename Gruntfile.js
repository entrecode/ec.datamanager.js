'use strict';

module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-run');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Project configuration.
  grunt.initConfig({
    run: {
      mockserver: {
        start: {
          exec: 'cd node_modules/ec.appcms-mock.js/ && ./run-server.sh start'
        },
        stop: {
          exec: 'cd node_modules/ec.appcms-mock.js/ && ./run-server.sh stop'
        }
      },
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
  grunt.registerTask('mockserver', ['run:mockserver:start']);
  grunt.registerTask('mockserver-stop', 'run:mockserver:stop');
  grunt.registerTask('test-backend', 'mochaTest');
  grunt.registerTask('test-frontend', ['mockserver', 'karma:test', 'mockserver-stop']);
  grunt.registerTask('build', ['run:browserify', 'uglify']);

};