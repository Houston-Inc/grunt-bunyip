var pty = require('pty.js');
var EventEmitter = require('events').EventEmitter;

function BunyipOutputParser() {
}

BunyipOutputParser.prototype.matchYetiEnter = function(strData) {
    return strData.indexOf('press Enter to begin testing') !== -1;
};

BunyipOutputParser.prototype.matchTestsPassed = function(strData) {
    return strData.indexOf('tests passed') !== -1;
};

BunyipOutputParser.prototype.parsePassedTestsData = function(strData) {
    var values;
    if(this.matchTestsPassed(strData)) {
        values = {};
        var passedRegexp = /(\d+) tests passed!\u001b\[0m \((\d+)ms\)/;
        var passed = passedRegexp.exec(strData);
        values.total = parseInt(passed[1], 10);
        values.time = parseInt(passed[2], 10);
        values.failed = 0;
    }
    return values;
};

BunyipOutputParser.prototype.matchTestsFailed = function(strData) {
    return strData.indexOf('tests failed') !== -1;
};

BunyipOutputParser.prototype.parseFailedTestsData = function(strData) {
    var values;
    if(this.matchTestsFailed(strData)) {
        values = {};
        var failureRegexp = /(\d+) of (\d+) tests failed\. \((\d+)ms\)/;
        var fails = failureRegexp.exec(strData);
        values.failed = parseInt(fails[1], 10);
        values.total = parseInt(fails[2], 10);
        values.time = parseInt(fails[3], 10);
    }
    return values;
};

BunyipOutputParser.prototype.matchAgentsString = function(strData) {
    return strData.indexOf('100% complete') !== -1;
};

BunyipOutputParser.prototype.parseAgents = function(strData) {
    var agents;
    if(this.matchAgentsString(strData)) {
        var agentRegexp = /100% complete \((\d+)/;
        var agent = agentRegexp.exec(strData);
        agents = parseInt(agent[1], 10);
    }
    return agents;
};

exports.BunyipOutputParser = BunyipOutputParser;

function BunyipRunner(options) {
    this.options = options;
    this.testData = {};
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

    self.on('testData', function(data) {
        self.setTestData(data);
    });

    self.on('agents', function(agents) {
        self.setAgents(agents);
    });

    var exit = function() {
        if(typeof self.exit === 'function') {
            self.exit();
        }
    };

    process.on('exit', function() {
        if(term.writable || term.readable) {
            term.destroy();
        }
    });
    term.on('exit', exit);

    var parser = new BunyipOutputParser();
    var commands = 0;
    var dataCount = 0;
    var bashStr;
    var command = exports.createCommandFromArgs(args);

    var toBePrinted = [];
    var partial = "";

    term.on('data', function(data) {
        var printString = partial+data;
        var strData = ""+data;
        var split = printString.split('\r\n');
        if(split.length > 0) {
            partial = split.pop();
            toBePrinted = split;
        }
        if(dataCount === 1) {
            bashStr = strData;
            if(bashStr.indexOf('\r')) {
                bashStr = bashStr.split('\r')[0];
            }
        }
        if(bashStr && 
           (strData).indexOf(bashStr) !== -1) {
            if(commands === 2) {
                self.destroyTerminal(term);
            }
            commands++;
        }
        if(parser.matchYetiEnter(strData)) {
            self.emit("yeti");
        }
        var agents = parser.parseAgents(strData);
        if(agents) {
            self.emit('agents', agents);
        }
        var failedData = parser.parseFailedTestsData(strData);
        if(failedData) {
            self.emit('testData', failedData);
        }
        var passedData = parser.parsePassedTestsData(strData);
        if(passedData) {
            self.emit('testData', passedData);
        }
        for(var i=0; i<toBePrinted.length; i++) {
            console.log(toBePrinted[i]);
        }
        dataCount++;
        self.emit("data", data);
    });
    setTimeout(function() {
        console.log("Running timeouted...");
        term.destroy();
    }, options.timeout || 30000);
    term.write('\r');
    term.write(command+'\r');
};

BunyipRunner.prototype.setAgents = function(agents) {
    this.testData.agents = agents;
};

BunyipRunner.prototype.setTestData = function(values) {
    this.testData.total = values.total;
    this.testData.failed = values.failed;
    this.testData.time = values.time;
};

BunyipRunner.prototype.destroyTerminal = function(term) {
    var self = this;
    setTimeout(function() {
        term.destroy();
    }, 1000);
};

BunyipRunner.prototype.exit = function() {
    this.emit('exit', this.testData);
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
