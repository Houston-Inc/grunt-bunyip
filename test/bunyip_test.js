var grunt = require('grunt'),
    expect = require('expect.js');

// In case the grunt being used to test is different than the grunt being
// tested, initialize the task and config subsystems.
if (grunt.task.searchDirs.length === 0) {
  grunt.task.init([]);
  grunt.config.init({});
}

describe('grunt-bunyip', function() {
    it('when running should return same code as bunyip', function() {
    });
});
