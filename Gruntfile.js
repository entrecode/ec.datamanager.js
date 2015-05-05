'use strict';

module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-run');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-karma');

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
      browserify: {
        exec: 'browserify -r ./index.js:ec.datamanager.js -o ./build/datamanager.js'
      },
      uglify: {
        exec: 'uglifyjs ./build/datamanager.js -m -c -o ./build/datamanager.js'
      },
      coverage: {
        exec: 'istanbul cover _mocha -- --recursive -R spec '
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
  grunt.registerTask('build', ['run:browserify', 'run:uglify']);

};