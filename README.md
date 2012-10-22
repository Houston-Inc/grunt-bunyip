# grunt-bunyip

It's the best grunt bunyip runner so far!

## Getting Started
Install this grunt plugin next to your project's [grunt.js gruntfile][getting_started]

Then add this line to your project's `grunt.js` gruntfile:

```javascript
grunt.loadNpmTasks('grunt-bunyip');
```

[grunt]: https://github.com/cowboy/grunt
[getting_started]: https://github.com/cowboy/grunt/blob/master/docs/getting_started.md

## Documentation

```javascript
grunt.initConfig({
    bunyip: {
        phantom: {
            waitBrowsersFor: 3000,
            args: [
                '-f',
                'test-build/test.html',
                'local',
                '-l',
                '"phantomjs"'
            ],
            timeout: 30000
        },
        all: {
            waitBrowsersFor: 6000,
            args: [
                '-f',
                'test-build/test.html',
                'local',
                '-l',
                '"firefox|chrome|safari|phantomjs"'
            ],
            timeout: 30000
        }
    }
}
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [grunt][grunt].

## Release History
0.0.1 - 12-10-2012

## License
Copyright (c) 2012 Houston Inc.  
Licensed under the MIT license.
