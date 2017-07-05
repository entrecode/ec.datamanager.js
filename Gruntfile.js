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
        output: 'Testserver started an listening on port*'
        // Override defaults here
      },
      test: {
        options: {
          script: 'test/mocks/mockserver.js'
        }
      }
    },
    run: {
      coverage: {
        exec: 'istanbul cover _mocha -- -R dot "test/**/*.test.js"'
      },
      openCoverage: {
        exec: 'open coverage/lcov-report/index.html'
      },
      browserify: {
        exec: 'browserify -r ./index.js:ec.datamanager.js -s DataManager -o ./build/datamanager.js'
      },
      uglify: {
        exec: 'uglifyjs -o ./build/datamanager.min.js ./build/datamanager.js'
      }
    },
    mochaTest: {
      test: {
        options: {
          reporter: 'dot'
        },
        src: ['test/**/*.test.js']
      }
    },
    karma: {
      test: {
        configFile: 'test/karma.conf.js'
      }
    }
  });

  // Default task(s).
  grunt.registerTask('mockserver', ['express:test']);
  grunt.registerTask('mockserver-stop', ['express:test:stop']);
  grunt.registerTask('test-backend', 'mochaTest');
  grunt.registerTask('test-frontend', ['build', 'mockserver', 'karma:test', 'mockserver-stop']);
  grunt.registerTask('build', ['run:browserify', 'run:uglify']);
  grunt.registerTask('test', ['test-backend', 'test-frontend']);
  grunt.registerTask('coverage', ['coverage-bamboo', 'run:openCoverage']);
  grunt.registerTask('coverage-bamboo', ['run:coverage']);
};
