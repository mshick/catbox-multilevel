/*
    Load http://localhost:8080 and refresh rapidly.
    Your initial load will say "I ain't got no..."
    For the next ~10 seconds your cached values will be prefixed with `CACHE:`
*/

var Catbox = require('catbox'),
    Http = require('http'),
    client;

function handler(req, res) {

    getResponse(function (err, item) {
        if (err) {
            res.writeHead(500);
            res.end();
        } else {
            res.writeHead(200, {
                'Content-Type': 'text/plain'
            });
            res.end(item);
        }
    });
};

function getResponse(done) {

    var key = {
        segment: 'test-segment',
        id: 'my-test-id'
    };

    var value = 'I ain\'t got no...';
    var ttl = 10 * 1000;

    client.get(key, function (err, cached) {

        if (err) {
            return done(err);
        } else if (cached) {
            return done(null, 'CACHE: ' + cached.item);
        } else {
            client.set(key, value, ttl, function (error) {
                done(error, value);
            });
        }
    });
};

function startCache(done) {

    var options = {
        partition: 'catbox-multilevel', // Keys start with `catbox-multilevel!`
        host: 'localhost', // Same as default
        port: 3000, // Same as default
        valueEncoding: 'json', // Same as default. Also accepts 'utf8'.
        sublevel: '', // Same as default. If you use a sublevel, set this and a manifest path.
        manifest: '', // Same as default. If you use sublevels, you'll need this. Requires the FULL path.
        auth: null // Same as default. Can provide an object, eg. { user: 'foo', pass: 'bar' }
    };

    // `require('catbox-multilevel')` in your own projects
    client = new Catbox.Client(require('../'), options);
    client.start(done);
};

function startServer(err) {

    if (err) {
        console.log(err);
        console.log('Could not connect to Multilevel server. Shutting down.')
        process.exit();
    } else {
        var server = Http.createServer(handler);
        server.listen(8080);
        console.log('Server started at http://localhost:8080/');
    }
};

startCache(startServer);
