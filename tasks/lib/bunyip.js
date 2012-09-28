var pty = require('pty.js');

exports.init = function(grunt) {
    var exports = {};

    exports.runBunyip = function(options) {
        var args = options.args;
        var term = pty.spawn('bash', [], {
            name: 'xterm-color',
            cols: 80,
            rows: 30,
            cwd: process.cwd(),
            env: process.env
        });
        process.on("onYeti", function() {
            console.log("onYeti");
            setTimeout(function() {
                console.log("ENTER");
                term.write('\r');
            }, options.waitBrowsersFor || 5000);
        });
        process.on("exit", options.done);

        term.on('exit', options.done);

        term.on('data', function(data) {
            var strData = ""+data;
            if(strData.indexOf("press Enter to begin testing") !== -1) {
                process.emit("onYeti");
            }
            if(strData.indexOf("100% complete") !== -1) {
                setTimeout(function() {
                    term.destroy();
                }, options.waitBrowsersFor || 1000);
            }
            console.log(strData);
        });
        term.write(exports.createCommandFromArgs(args)+'\r');
    };

    exports.createCommandFromArgs = function(args) {
        var command = "bunyip ";
        var sanitized = sanitizeArguments(args);
        for(var i=0; i<sanitized.length; i++) {
            command += sanitized[i];
            command += (i+1 === sanitized.length ? "" : " ");
        }
        return command;
    };

    function sanitizeArguments(args) {
        var sanitized = [];
        for(var i=0; i<args.length; i++) {
            var argh = args[i];
            if(!exports.isSane(argh)) {
                console.warn('Skipping parameter', argh);
            }
            else {
                sanitized.push(argh);
            }
        }
        return sanitized;
    }

    var sanitizers = [
        function(param) { 
            return param.indexOf('config') === -1;
        },
        function(param) {
            return param.indexOf(';') === -1;
        }
    ];

    exports.isSane = function(arg) {
        for(var i=0; i<sanitizers.length; i++) {
            if(!sanitizers[i](arg)) {
                return false;
            }
        }
        return true;
    };

    return exports;
};
