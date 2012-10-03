var pty = require('pty.js');
var EventEmitter = require('events').EventEmitter;

function BunyipRunner(options) {
    this.options = options;
    this.failed = -1;
    this.agents = -1;
}

function clone(object) {
    function OneShotConstructor(){}
    OneShotConstructor.prototype = object;
    return new OneShotConstructor();
}

/**
 * Inherit from `EventEmitter.prototype`.
 */

BunyipRunner.prototype = clone(EventEmitter.prototype);
BunyipRunner.prototype.constructor = BunyipRunner;

BunyipRunner.prototype.run = function(options) {
    options = this.options || options;
    this.options = options;
    var self = this;
    if(!options) {
        throw "No options given. Check your parameters!";
    }
    var args = options.args;
    var term = pty.spawn('bash', [], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: process.cwd(),
        env: process.env
    });
    self.on("yeti", function() {
        setTimeout(function() {
            term.write('\r');
            self.emit("onBrowserEnter");
        }, options.waitBrowsersFor || 5000);
    });

    var exit = function() {
        if(typeof self.exit === 'function') {
            self.exit();
        }
    };

    process.on('exit', exit);
    term.on('exit', exit);

    var commands = 0;

    term.on('data', function(data) {
        var strData = ""+data;
        if(strData.indexOf('bash') !== -1) {
            if(commands > 0) {
                self.destroyTerminal(term);
            }
            commands++;
        }
        if(strData.indexOf('press Enter to begin testing') !== -1) {
            self.emit("yeti");
        }
        if(strData.indexOf('100% complete') !== -1) {
            var agentRegexp = /100% complete \((\d)/;
            var agents = agentRegexp.exec(strData);
            self.agents = parseInt(agents[1], 10);
        }
        if(strData.indexOf('tests failed') !== -1) {
            var failureRegexp = /(\d+) of (\d+) tests failed\. \((\d+)ms\)/;
            var fails = failureRegexp.exec(strData);
            self.failed = parseInt(fails[1], 10);
            self.total = parseInt(fails[2], 10);
            self.time = parseInt(fails[3], 10);
        }
        if(strData.indexOf('tests passed') !== -1) {
            var passedRegexp = /(\d+) tests passed!\u001b\[0m \((\d+)ms\)/;
            var passed = passedRegexp.exec(strData);
            self.total = parseInt(passed[1], 10);
            self.time = parseInt(passed[2], 10);
            self.failed = 0;
        }
        self.emit("data", data);
        console.log(strData);
    });
    term.write(exports.createCommandFromArgs(args)+'\r');
};

BunyipRunner.prototype.destroyTerminal = function(term) {
    var self = this;
    setTimeout(function() {
        term.destroy();
    }, 1000);
};

BunyipRunner.prototype.exit = function() {
    this.exit = true;
    var values = {
        agents: this.agents,
        failed: this.failed,
        total: this.total,
        time: this.time
    };
    this.emit('exit', values);
};

exports.BunyipRunner = BunyipRunner;

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

exports.createCommandFromArgs = function(args) {
    var command = "bunyip ";
    var sanitized = sanitizeArguments(args);
    for(var i=0; i<sanitized.length; i++) {
        command += sanitized[i];
        command += (i+1 === sanitized.length ? "" : " ");
    }
    return command;
};

var apostrophes = ["'", '"', '`'];

function isApostropheCharacter(chr) {
    var r = false;
    for(var i=0; i<apostrophes.length; i++) {
        if(apostrophes[i] === chr) {
            r = true;
        }
    }
    return r;
}

function onlyInEndAndBegin(str) {
    if(str.length < 2) {
        return false;
    }
    var begin = str[0],
        end = str[str.length-1];
    var r = false;
    for(var i=1; i<str.length; i++) {
        if(str[i] === begin && i === str.length-1) {
            r = true;
        }
    }
    return r;
}

var sanitizers = [
    function(param) {
        return param.indexOf('config') === -1;
    },
    function(param) {
        return param.indexOf(';') === -1;
    },
    function(param) {
        var r = false;
        if(!isApostropheCharacter(param[0])) {
            r = true;
        }
        else {
            r = onlyInEndAndBegin(param);
        }
        return r;
    },
    function(param) {
        var r = false;
        if(param.indexOf('|') !== -1) {
            var begin = param[0],
                end = param[param.length-1];
            if(isApostropheCharacter(begin) &&
               onlyInEndAndBegin(param)) {
                r = true;
            }
        }
        else {
            r = true;
        }
        return r;
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

module.exports = exports;
