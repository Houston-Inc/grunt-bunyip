/*
 * grunt-bunyip
 * https://github.com/bleadof/grunt-bunyip
 *
 * Copyright (c) 2012 Tarmo Aidantausta
 * Licensed under the MIT license.
 */

module.exports = function(grunt) {

    // Please see the grunt documentation for more information regarding task and
    // helper creation: https://github.com/cowboy/grunt/blob/master/docs/toc.md

    // ==========================================================================
    // TASKS
    // ==========================================================================

    grunt.registerTask('bunyip', 'Runs bunyip through grunt', function() {
        console.debug(this);
        var taskDone = this.async();
        var options = {
            args: grunt.config('bunyip'),
            done: function(err, result, code) {
                taskDone(err, result, code);
            }
        };
        var code = runBunyip(options);
    });
};
