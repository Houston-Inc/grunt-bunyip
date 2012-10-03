module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        lint: {
            files: ['grunt.js', 'tasks/**/*.js', 'test/**/*.js']
        },
        watch: {
            files: '<config:lint.files>',
            tasks: 'default'
        },
        jshint: {
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                boss: true,
                eqnull: true,
                node: true,
                es5: true
            },
            globals: {
                describe: true,
                it: true
            }
        },
        simplemocha: {
            all: {
                src: 'test/**/*.js',
                options: {
                    globals: ['expect'],
                    timeout: 15000,
                    ignoreLeaks: false,
                    ui: 'bdd',
                    reporter: 'tap'
                }
            }
        }

    });

    // For this to work, you need to have run `npm install grunt-simple-mocha`
    grunt.loadNpmTasks('grunt-simple-mocha');

    // Load local tasks.
    grunt.loadTasks('tasks');

    // Default task.
    grunt.registerTask('default', 'lint simplemocha');

};
