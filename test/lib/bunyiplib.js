var expect = require('expect.js');

var grunt = require('grunt');
var grunt_bunyip = require('../../tasks/lib/bunyip');

describe('BunyipRunner', function() {
    var successBunyipArgs = [
        '-f',
        'test-assets/success/test.html',
        'local',
        '-l',
        '"firefox|chrome|safari|phantomjs"'
    ];
    var failureBunyipArgs = [
        '-f',
        'test-assets/failure/test.html',
        'local',
        '-l',
        '"firefox|chrome|safari|phantomjs"'
    ];
    var badArgs = [
        'config',
        'foo;',
        '"firefox|\'',
        '-f',
        'test-assets/success/test.html',
        'local',
        '-l',
        '"firefox|chrome|safari|phantomjs"'
    ];

    describe('#run', function() {
        var bunyipConf = {
            args: successBunyipArgs
        };
        it('should run the bunyip with given arguments', function(testDone) {
            bunyipConf.args = successBunyipArgs;
            var runner = new grunt_bunyip.BunyipRunner(bunyipConf);
            runner.on("exit", function(values) {
                expect(values.failed).to.eql(0);
                expect(values.agents).to.be.ok();
                expect(values.total).to.be.ok();
                expect(values.time).to.be.ok();
                testDone();
            });
            runner.run();
        });
        it('should report the failed tests', function(testDone) {
            bunyipConf.args = failureBunyipArgs;            
            var runner = new grunt_bunyip.BunyipRunner(bunyipConf);
            runner.on("exit", function(values) {
                expect(values.failed).to.eql(values.agents*2);
                expect(values.agents).to.be.ok();
                expect(values.total).to.be.ok();
                expect(values.time).to.be.ok();
                testDone();
            });
            runner.run();            
        });
        describe('#printStrings', function() {
            var strings = ['foo', ' bar', 'baz \r\n arr'];
            var instance = new grunt_bunyip.BunyipRunner();
            var log = console.log;
            var received = instance.printStrings(strings);
            expect(received).to.be.an('array');
            expect(received[0]).to.eql(' arr');
        });
    });
    describe('#createCommandFromArgs', function() {
        it('should generate a bunyip command from the arguments', function() {
            var expected = 'bunyip -f test-assets/success/test.html local -l "firefox|chrome|safari|phantomjs"';
            expect(grunt_bunyip.createCommandFromArgs(successBunyipArgs)).to.eql(expected);
        });
        it('should sanitize arguments like config', function() {
            var expected = 'bunyip -f test-assets/success/test.html local -l "firefox|chrome|safari|phantomjs"';
            expect(grunt_bunyip.createCommandFromArgs(badArgs)).to.eql(expected);
        });
    });
    describe('#isSane', function() {
        var insaneParams = ['config', 'foo;', '"firefox\''];
        it('should not accept params like config, foo; or "firefox\'', function() {
            expect(grunt_bunyip.isSane(insaneParams[0])).to.not.be.ok();
            expect(grunt_bunyip.isSane(insaneParams[1])).to.not.be.ok();
            expect(grunt_bunyip.isSane(insaneParams[2])).to.not.be.ok();
        });
    });
});


