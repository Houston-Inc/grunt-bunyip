/*
 * grunt-bunyip
 * https://github.com/bleadof/grunt-bunyip
 *
 * Copyright (c) 2012 Tarmo Aidantausta
 * Licensed under the MIT license.
 */

var runner = require('./lib/bunyip.js');

module.exports = function(grunt) {

    // ==========================================================================
    // TASKS
    // ==========================================================================
    grunt.registerTask('bunyip', 'Runs bunyip through grunt', function() {
        var taskDone = this.async();
        var options = grunt.config('bunyip');
        var bunyipRunner = new runner.BunyipRunner(options);
        bunyipRunner.on("exit", function(values) {
            var error = true;
            if(values.failed > 0) {
                error = false;
            }
            taskDone(error);
        });
        bunyipRunner.run();
    });
};
