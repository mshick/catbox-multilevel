var Path = require('path'),
    Lab = require('lab'),
    lab = Lab.script(),
    Catbox = require('catbox'),
    Multilevel = require('..');

exports.lab = lab;

var expect = Lab.expect;
var before = lab.before;
var after = lab.after;
var describe = lab.experiment;
var it = lab.test;

describe('Multilevel', function () {

    it('throws an error if not created with new', function (done) {

        var fn = function () {

            var multilevel = Multilevel();
        };

        expect(fn).to.throw(Error);
        done();
    });

    it('throws an error if valueEncoding is incorrect', function (done) {
        var options = {
            valueEncoding: 'binary'
        };

        var fn = function () {

            var multilevel = new Multilevel(options);
        };

        expect(fn).to.throw(Error);
        done();
    });

    it('throws an error if a sublevel is specified without a manifest', function (done) {
        var options = {
            sublevel: 'test'
        };

        var fn = function () {

            var multilevel = new Multilevel(options);
        };

        expect(fn).to.throw(Error);
        done();
    });

    it('loads a specified manifest file', function (done) {
        var options = {
            manifest: require('./fixtures/manifest.json')
        };
        var client = new Multilevel(options);
        client.start(function (err) {

            expect(client.isReady()).to.equal(true);
            done();
        });
    });

    it('creates a new connection', function (done) {

        var client = new Catbox.Client(Multilevel);
        client.start(function (err) {

            expect(client.isReady()).to.equal(true);
            done();
        });
    });

    it('closes the connection', function (done) {

        var client = new Catbox.Client(Multilevel);
        client.start(function (err) {

            expect(client.isReady()).to.equal(true);
            client.stop();
            expect(client.isReady()).to.equal(false);
            done();
        });
    });

    it('gets an item after setting it with defaults', function (done) {

        var client = new Catbox.Client(Multilevel);
        client.start(function (err) {

            var key = {
                id: 'x',
                segment: 'test'
            };
            client.set(key, '123', 500, function (err) {

                expect(err).to.not.exist;
                client.get(key, function (err, result) {

                    expect(err).to.equal(null);
                    expect(result.item).to.equal('123');
                    done();
                });
            });
        });
    });

    it('fails setting an item circular references', function (done) {

        var options = {
            host: 'localhost',
            port: 3000,
            manifest: require('./fixtures/manifest.json'),
            sublevel: 'utf8',
            valueEncoding: 'utf8'
        };

        var client = new Catbox.Client(Multilevel);
        client.start(function (err) {

            var key = { id: 'x', segment: 'test' };
            var value = { a: 1 };
            value.b = value;
            client.set(key, value, 10, function (err) {

                expect(err.message).to.equal('Converting circular structure to JSON');
                done();
            });
        });
    });

    it('ignored starting a connection twice on same event', function (done) {

        var client = new Catbox.Client(Multilevel);
        var x = 2;
        var start = function () {

            client.start(function (err) {

                expect(client.isReady()).to.equal(true);
                --x;
                if (!x) {
                    done();
                }
            });
        };

        start();
        start();
    });

    it('ignored starting a connection twice chained', function (done) {

        var client = new Catbox.Client(Multilevel);
        client.start(function (err) {

            expect(err).to.not.exist;
            expect(client.isReady()).to.equal(true);

            client.start(function (err) {

                expect(err).to.not.exist;
                expect(client.isReady()).to.equal(true);
                done();
            });
        });
    });

    it('returns not found on get when using null key', function (done) {

        var client = new Catbox.Client(Multilevel);
        client.start(function (err) {

            client.get(null, function (err, result) {

                expect(err).to.equal(null);
                expect(result).to.equal(null);
                done();
            });
        });
    });

    it('returns not found on get when item expired', function (done) {

        var client = new Catbox.Client(Multilevel);
        client.start(function (err) {

            var key = {
                id: 'x',
                segment: 'test'
            };
            client.set(key, 'x', 1, function (err) {

                expect(err).to.not.exist;
                setTimeout(function () {

                    client.get(key, function (err, result) {

                        expect(err).to.equal(null);
                        expect(result).to.equal(null);
                        done();
                    });
                }, 2);
            });
        });
    });

    it('returns error on set when using null key', function (done) {

        var client = new Catbox.Client(Multilevel);
        client.start(function (err) {

            client.set(null, {}, 1000, function (err) {

                expect(err instanceof Error).to.equal(true);
                done();
            });
        });
    });

    it('returns error on get when using invalid key', function (done) {

        var client = new Catbox.Client(Multilevel);
        client.start(function (err) {

            client.get({}, function (err) {

                expect(err instanceof Error).to.equal(true);
                done();
            });
        });
    });

    it('returns error on drop when using invalid key', function (done) {

        var client = new Catbox.Client(Multilevel);
        client.start(function (err) {

            client.drop({}, function (err) {

                expect(err instanceof Error).to.equal(true);
                done();
            });
        });
    });

    it('returns error on set when using invalid key', function (done) {

        var client = new Catbox.Client(Multilevel);
        client.start(function (err) {

            client.set({}, {}, 1000, function (err) {

                expect(err instanceof Error).to.equal(true);
                done();
            });
        });
    });

    it('ignores set when using non-positive ttl value', function (done) {

        var client = new Catbox.Client(Multilevel);
        client.start(function (err) {

            var key = {
                id: 'x',
                segment: 'test'
            };
            client.set(key, 'y', 0, function (err) {

                expect(err).to.not.exist;
                done();
            });
        });
    });

    it('returns error on drop when using null key', function (done) {

        var client = new Catbox.Client(Multilevel);
        client.start(function (err) {

            client.drop(null, function (err) {

                expect(err instanceof Error).to.equal(true);
                done();
            });
        });
    });

    it('returns error on get when stopped', function (done) {

        var client = new Catbox.Client(Multilevel);
        client.stop();
        var key = {
            id: 'x',
            segment: 'test'
        };
        client.connection.get(key, function (err, result) {

            expect(err).to.exist;
            expect(result).to.not.exist;
            done();
        });
    });

    it('returns error on set when stopped', function (done) {

        var client = new Catbox.Client(Multilevel);
        client.stop();
        var key = {
            id: 'x',
            segment: 'test'
        };
        client.connection.set(key, 'y', 1, function (err) {

            expect(err).to.exist;
            done();
        });
    });

    it('returns error on drop when stopped', function (done) {

        var client = new Catbox.Client(Multilevel);
        client.stop();
        var key = {
            id: 'x',
            segment: 'test'
        };
        client.connection.drop(key, function (err) {

            expect(err).to.exist;
            done();
        });
    });

    it('returns error on missing segment name', function (done) {

        var config = {
            expiresIn: 50000
        };
        var fn = function () {

            var client = new Catbox.Client(Multilevel);
            var cache = new Catbox.Policy(config, client, '');
        };
        expect(fn).to.throw(Error);
        done();
    });

    it('returns error on bad segment name', function (done) {

        var config = {
            expiresIn: 50000
        };
        var fn = function () {

            var client = new Catbox.Client(Multilevel);
            var cache = new Catbox.Policy(config, client, 'a\0b');
        };
        expect(fn).to.throw(Error);
        done();
    });

    it('returns error when cache item dropped while stopped', function (done) {

        var client = new Catbox.Client(Multilevel);
        client.stop();
        client.drop('a', function (err) {

            expect(err).to.exist;
            done();
        });
    });

    describe('#start', function () {

        it('sets client to when the connection succeeds', function (done) {

            var options = {
                host: 'localhost',
                port: 3000
            };

            var multilevel = new Multilevel(options);

            multilevel.start(function (err) {

                expect(err).to.not.exist;
                expect(multilevel.client).to.exist;
                done();
            });
        });

        it('reuses the client when a connection is already started', function (done) {

            var options = {
                host: 'localhost',
                port: 3000
            };

            var multilevel = new Multilevel(options);

            multilevel.start(function (err) {

                expect(err).to.not.exist;
                var client = multilevel.client;

                multilevel.start(function () {

                    expect(client).to.equal(multilevel.client);
                    done();
                });
            });
        });

        it('returns an error when connection fails', function (done) {

            var options = {
                host: 'localhost',
                port: 6380
            };

            var multilevel = new Multilevel(options);

            multilevel.start(function (err) {

                expect(err).to.exist;
                expect(err).to.be.instanceOf(Error);
                expect(multilevel.client).to.not.exist;
                done();
            });
        });

        it('sends auth command when password is provided', function (done) {

            var options = {
                host: 'localhost',
                port: 3000,
                auth: {
                    user: 'test',
                    password: 'test'
                }
            };

            var multilevel = new Multilevel(options);

            var log = console.log;
            console.log = function (message) {

                expect(message).to.contain('Warning');
                console.log = log;
            };

            multilevel.start(function (err) {
                done();
            });
        });

        it('stops the client and kill the socket on error post connection', function (done) {

            var options = {
                host: 'localhost',
                port: 3000
            };

            var multilevel = new Multilevel(options);

            multilevel.start(function (err) {

                expect(err).to.not.exist;
                expect(multilevel.socket).to.exist;

                multilevel.socket.emit('error', new Error('injected'));
                expect(multilevel.socket).to.not.exist;
                done();
            });
        });
    });

    describe('#validateSegmentName', function () {

        it('returns an error when the name is empty', function (done) {

            var options = {
                host: 'localhost',
                port: 3000
            };

            var multilevel = new Multilevel(options);

            var result = multilevel.validateSegmentName('');

            expect(result).to.be.instanceOf(Error);
            expect(result.message).to.equal('Empty string');
            done();
        });

        it('returns an error when the name has a null character', function (done) {

            var options = {
                host: 'localhost',
                port: 3000
            };

            var multilevel = new Multilevel(options);

            var result = multilevel.validateSegmentName('\0test');

            expect(result).to.be.instanceOf(Error);
            done();
        });

        it('returns null when there aren\'t any errors', function (done) {

            var options = {
                host: 'localhost',
                port: 3000
            };

            var multilevel = new Multilevel(options);

            var result = multilevel.validateSegmentName('valid');

            expect(result).to.not.be.instanceOf(Error);
            expect(result).to.equal(null);
            done();
        });
    });

    describe('#get', function () {

        it('passes an error to the callback when the connection is closed', function (done) {

            var options = {
                host: 'localhost',
                port: 3000
            };

            var multilevel = new Multilevel(options);

            multilevel.get('test', function (err) {

                expect(err).to.exist;
                expect(err).to.be.instanceOf(Error);
                expect(err.message).to.equal('Connection not started');
                done();
            });
        });

        it('passes an error to the callback when there is an error returned from getting an item', function (done) {

            var options = {
                host: 'localhost',
                port: 3000
            };

            var multilevel = new Multilevel(options);
            multilevel.client = {
                get: function (item, callback) {

                    callback(new Error());
                }
            };

            multilevel.get('test', function (err) {

                expect(err).to.exist;
                expect(err).to.be.instanceOf(Error);
                done();
            });
        });

        it('passes an error to the callback when there is an error parsing the result', function (done) {

            var options = {
                host: 'localhost',
                port: 3000,
                valueEncoding: 'utf8'
            };

            var multilevel = new Multilevel(options);
            multilevel.client = {
                get: function (item, callback) {

                    callback(null, 'test');
                }
            };

            multilevel.get('test', function (err) {

                expect(err).to.exist;
                expect(err.message).to.equal('Bad envelope content');
                done();
            });
        });

        it('passes an error to the callback when there is an error with the envelope structure (stored)', function (done) {

            var options = {
                host: 'localhost',
                port: 3000
            };

            var multilevel = new Multilevel(options);
            multilevel.client = {
                get: function (item, callback) {

                    callback(null, '{ "item": "false" }');
                }
            };

            multilevel.get('test', function (err) {

                expect(err).to.exist;
                expect(err.message).to.equal('Incorrect envelope structure');
                done();
            });
        });

        it('passes an error to the callback when there is an error with the envelope structure (item)', function (done) {

            var options = {
                host: 'localhost',
                port: 3000
            };

            var multilevel = new Multilevel(options);
            multilevel.client = {
                get: function (item, callback) {

                    callback(null, '{ "stored": "123" }');
                }
            };

            multilevel.get('test', function (err) {

                expect(err).to.exist;
                expect(err.message).to.equal('Incorrect envelope structure');
                done();
            });
        });

        it('is able to retrieve an object thats stored when connection is started', function (done) {

            var options = {
                host: 'localhost',
                port: 3000,
                partition: 'wwwtest',
                valueEncoding: 'json'
            };
            var key = {
                id: 'test',
                segment: 'test'
            };

            var multilevel = new Multilevel(options);

            multilevel.start(function () {

                multilevel.set(key, 'myvalue', 200, function (err) {

                    expect(err).to.not.exist;
                    multilevel.get(key, function (err, result) {

                        expect(err).to.not.exist;
                        expect(result.item).to.equal('myvalue');
                        done();
                    });
                });
            });
        });

        it('is able to retrieve an object that is stored in utf8', function (done) {

            var options = {
                host: 'localhost',
                port: 3000,
                valueEncoding: 'utf8',
                sublevel: 'utf8',
                manifest: require('./fixtures/manifest.json')
            };
            var key = {
                id: 'testutf8',
                segment: 'test'
            };

            var multilevel = new Multilevel(options);

            multilevel.start(function () {

                multilevel.set(key, 'myvalue', 200, function (err) {

                    expect(err).to.not.exist;
                    multilevel.get(key, function (err, result) {

                        expect(err).to.not.exist;
                        expect(result.item).to.equal('myvalue');
                        done();
                    });
                });
            });
        });

        it('returns null when unable to find the item', function (done) {

            var options = {
                host: 'localhost',
                port: 3000,
                partition: 'wwwtest'
            };
            var key = {
                id: 'notfound',
                segment: 'notfound'
            };

            var multilevel = new Multilevel(options);

            multilevel.start(function () {

                multilevel.get(key, function (err, result) {

                    expect(err).to.not.exist;
                    expect(result).to.not.exist;
                    done();
                });
            });
        });
    });

    describe('#set', function () {

        it('passes an error to the callback when the connection is closed', function (done) {

            var options = {
                host: 'localhost',
                port: 3000
            };

            var multilevel = new Multilevel(options);

            multilevel.set('test1', 'test1', 3600, function (err) {

                expect(err).to.exist;
                expect(err).to.be.instanceOf(Error);
                expect(err.message).to.equal('Connection not started');
                done();
            });
        });

        it('passes an error to the callback when there is an error returned from setting an item', function (done) {

            var options = {
                host: 'localhost',
                port: 3000
            };

            var multilevel = new Multilevel(options);
            multilevel.client = {
                put: function (key, item, callback) {

                    callback(new Error());
                }
            };

            multilevel.set('test', 'test', 3600, function (err) {

                expect(err).to.exist;
                expect(err).to.be.instanceOf(Error);
                done();
            });
        });
    });

    describe('#drop', function () {

        it('passes an error to the callback when the connection is closed', function (done) {

            var options = {
                host: 'localhost',
                port: 3000
            };

            var multilevel = new Multilevel(options);

            multilevel.drop('test2', function (err) {

                expect(err).to.exist;
                expect(err).to.be.instanceOf(Error);
                expect(err.message).to.equal('Connection not started');
                done();
            });
        });

        it('deletes the item from multilevel', function (done) {

            var options = {
                host: 'localhost',
                port: 3000
            };

            var multilevel = new Multilevel(options);
            multilevel.client = {
                del: function (key, callback) {

                    callback(null, null);
                }
            };

            multilevel.drop('test', function (err) {

                expect(err).to.not.exist;
                done();
            });
        });
    });

    describe('#stop', function () {

        it('sets the client to null', function (done) {

            var options = {
                host: 'localhost',
                port: 3000
            };

            var multilevel = new Multilevel(options);

            multilevel.start(function () {

                expect(multilevel.client).to.exist;
                multilevel.stop();
                expect(multilevel.client).to.not.exist;
                done();
            });
        });
    });
});
