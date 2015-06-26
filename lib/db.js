var Util = require('util');
var EventEmitter = require('events').EventEmitter;
var Multilevel = require('multilevel');
var Reconnect = require('reconnect-net');
var Hoek = require('hoek');


var internals = {};

internals.defaults = {
    _reconnectAttempts: 10
};

internals.Db = function () {
    this.socket = null;
    this.client = null;
};

Util.inherits(internals.Db, EventEmitter);

internals.Db.prototype.createClient = function (port, host, options) {

    var self = this,
        connectionEstablished,
        settings;

    settings = Hoek.applyToDefaults(internals.defaults, options);

    if (this.client) {
        return this.client;
    }

    function connectFn(conn) {

        var rpc = self.client.createRpcStream();

        rpc.on('error', function (err) {
            self.emit('error', err);
        });

        if (settings.auth) {
            self.client.auth(settings.auth);
        }

        conn.pipe(rpc).pipe(conn);

        connectionEstablished = true;

        // Primarily for testing...
        self._rpc = rpc;

        self.emit('connect');
    }

    this.client = Multilevel.client(settings.manifest);
    this.socket = new Reconnect(connectFn).connect(port, host, settings);

    this.socket.on('disconnect', function () {
        if (connectionEstablished) {
            self.emit('disconnect');
        } else {
            self.emit('error', new Error('Unsuccessful connection'));
        }
    });

    this.socket.on('reconnect', function (attempts) {
        if (settings._reconnectAttempts && settings._reconnectAttempts < attempts) {
            self.socket.reconnect = false;
            self.emit('error', new Error('Max reconnect attempts exceeded'));
        } else {
            self.emit('reconnect', attempts);
        }
    });

    this.socket.on('error', function (err) {
        self.emit('error', err);
    });

    return this.client;
};

internals.Db.prototype.quit = function () {
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

module.exports = internals.Db;
