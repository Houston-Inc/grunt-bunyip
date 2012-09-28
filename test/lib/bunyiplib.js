var expect = require('expect.js');

var grunt = require('grunt');
var grunt_bunyip = require('../../tasks/lib/bunyip').init(grunt);

describe('grunt bunyip lib', function() {
    var bunyipArgs = [
        '-f',
        'test-assets/success/test.html',
        'local',
        '-l',
        '"firefox|chrome|safari|phantomjs"'
    ];
    var badArgs = [
        'config',
        'foo;',
        '-f',
        'test-assets/success/test.html',
        'local',
        '-l',
        '"firefox|chrome|safari|phantomjs"'
    ];

    describe('#runBunyip', function() {
        var bunyipConf = {
            args: bunyipArgs
        };
        it('should run the bunyip with given arguments', function(testDone) {
            bunyipConf.done = function() {
                testDone();
            };
            grunt_bunyip.runBunyip(bunyipConf);
        });
    });
    describe('#createCommandFromArgs', function() {
        it('should generate a bunyip command from the arguments', function() {
            var expected = 'bunyip -f test-assets/success/test.html local -l "firefox|chrome|safari|phantomjs"';
            expect(grunt_bunyip.createCommandFromArgs(bunyipArgs)).to.eql(expected);
        });
        it('should sanitize arguments like config', function() {
            var expected = 'bunyip -f test-assets/success/test.html local -l "firefox|chrome|safari|phantomjs"';
            expect(grunt_bunyip.createCommandFromArgs(badArgs)).to.eql(expected);
        });
    });
    describe('#isSane', function() {
        var insaneParams = ['config', 'foo;'];
        it('should not accept params like config or foo;', function() {
            expect(grunt_bunyip.isSane(insaneParams[0])).to.not.be.ok();
            expect(grunt_bunyip.isSane(insaneParams[1])).to.not.be.ok();
        });
    });
});


