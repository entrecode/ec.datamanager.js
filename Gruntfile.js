'use strict';

module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-run');

  // Project configuration.
  grunt.initConfig({
    run: {
      mockserver: {
        options: {
          wait: true
        },
        exec: 'nohup node ./node_modules/ec.appcms-mock.js/server.js &'
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
  grunt.registerTask('mockserver', ['run:mockserver']);
  grunt.registerTask('build', ['run:browserify', 'run:uglify']);

};