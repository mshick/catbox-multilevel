var Util = require('util'),
    EventEmitter = require('events').EventEmitter,
    Multilevel = require('multilevel'),
    Reconnect = require('reconnect-net'),
    defaults;

function Db(options) {
    this.socket = null;
    this.client = null;
}

Util.inherits(Db, EventEmitter);

Db.prototype.createClient = function (port, host, options) {

    var self = this,
        connectionEstablished;

    options = options || {};

    function connectFn(conn) {

        var rpc = self.client.createRpcStream();

        rpc.on('error', function (err) {
            self.emit('error', err);
        });

        if (options.auth) {
            self.client.auth(options.auth);
        }

        conn.pipe(rpc).pipe(conn);
        connectionEstablished = true;
        self.emit('connect');
    }

    this.client = Multilevel.client(options.manifest);
    this.socket = new Reconnect(connectFn).connect(port, host, options);

    this.socket.on('disconnect', function () {
        if (connectionEstablished) {
            self.emit('disconnect');
        } else {
            self.emit('error', new Error('Unsuccessful connection'));
        }
    });

    this.socket.on('reconnect', function (attempts, delay) {
        if (options._reconnectAttempts && options._reconnectAttempts > attempts) {
            self.socket.reconnect = false;
            self.emit('error', new Error('Max reconnect attempts exceeded'));
        } else {
            self.emit('reconnect');
        }
    });

    this.socket.on('error', function (err) {
        self.emit('error', err);
    });

    return this.client;
};

Db.prototype.quit = function () {
    if (this.client) {
        this.client.close();
        this.client = null;
    }

    if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
    }
};

module.exports = Db;
