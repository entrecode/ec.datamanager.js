'use strict';

module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-run');

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
      }
    }
  });


  // Default task(s).
  grunt.registerTask('mockserver', ['run:mockserver:start']);
  grunt.registerTask('mockserver-stop', 'run:mockserver:stop');
  grunt.registerTask('build', ['run:browserify', 'run:uglify']);

};