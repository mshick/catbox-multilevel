var Multilevel = require('multilevel'),
    Net = require('net'),
    Hoek = require('hoek'),
    Db = require('./db'),
    defaults;

defaults = {
    host: 'localhost',
    port: 3000,
    keyEncoding: 'utf8',
    valueEncoding: 'utf8',
    sublevel: '',
    auth: null,
    _reconnect: true // Mostly just for debugging
};

function MultilevelCache(options) {

    Hoek.assert(this.constructor === MultilevelCache, 'Multilevel cache client must be instantiated using new');

    this.settings = Hoek.applyToDefaults(defaults, options);

    Hoek.assert(this.settings.keyEncoding === 'utf8', 'Only utf8 keyEncodings are supported');
    Hoek.assert(['json', 'utf8'].indexOf(this.settings.valueEncoding) > -1, 'Only utf8 and json valueEncodings are supported');

    if (this.settings.sublevel) {
        Hoek.assert(this.settings.manifest, 'A manifest file is required when using sublevels');
    }

    if (this.settings.manifest) {
        Hoek.assert(this.settings.manifest instanceof Object, 'You must provide a manifest object, not just a path');
    }

    this.socket = null;
    this.client = null;
}

MultilevelCache.prototype.start = function (callback) {

    var self = this,
        settings,
        db,
        client,
        socket;

    settings = this.settings;

    if (this.client) {
        return Hoek.nextTick(callback)();
    }

    db = new Db();

    client = db.createClient(settings.port, settings.host, settings);

    // Listen to errors
    db.on('error', function (err) {

        if (!self.client) {
            return callback(err);
        }

        self.stop();
    });

    // Wait for connection
    db.once('connect', function () {

        self.db = db;

        if (settings.sublevel) {
            self.client = client.sublevel(settings.sublevel);
        } else {
            self.client = client;
        }

        return callback();
    });
};

MultilevelCache.prototype.stop = function () {
    if (this.client) {
        this.client.close();
        this.client = null;
        this.db.removeAllListeners();
        this.db.quit();
        this.db = null;
    }
};

MultilevelCache.prototype.isReady = function () {

    return (!!this.client);
};

MultilevelCache.prototype.validateSegmentName = function (name) {

    if (!name) {
        return new Error('Empty string');
    }

    if (name.indexOf('\0') !== -1) {
        return new Error('Includes null character');
    }

    return null;
};

MultilevelCache.prototype.get = function (key, callback) {

    var settings,
        envelope,
        now;

    settings = this.settings;

    if (!this.client) {
        return callback(new Error('MultilevelCache not started'));
    }

    this.client.get(this.generateKey(key), function (err, result) {

        if (err && !err.notFound) {
            return callback(err);
        }

        if (!result) {
            return callback(null, null);
        }

        envelope = null;
        if (settings.valueEncoding === 'utf8') {
            try {
                envelope = JSON.parse(result);
            } catch (err) {} // Handled by validation below
        }
        else {
            envelope = result;
        }

        if (!envelope) {
            return callback(new Error('Bad envelope content'));
        }

        if (!envelope.item ||
            !envelope.stored) {

            return callback(new Error('Incorrect envelope structure'));
        }

        // Test stale
        now = Date.now();
        if ((now - envelope.stored) >= envelope.ttl) {
            return callback(null, null);
        }

        return callback(null, envelope);
    });
};

MultilevelCache.prototype.set = function (key, value, ttl, callback) {

    var settings,
        envelope,
        cacheKey,
        setEnvelope;

    settings = this.settings;

    if (!this.client) {
        return callback(new Error('MultilevelCache not started'));
    }

    envelope = {
        item: value,
        stored: Date.now(),
        ttl: ttl
    };

    cacheKey = this.generateKey(key);

    setEnvelope = null;

    if (settings.valueEncoding === 'utf8') {
        try {
            setEnvelope = JSON.stringify(envelope);
        } catch (err) {
            return callback(err);
        }
    }
    else {
        setEnvelope = envelope;
    }

    this.client.put(cacheKey, setEnvelope, function (err) {
        callback(err);
    });
};

MultilevelCache.prototype.drop = function (key, callback) {

    if (!this.client) {
        return callback(new Error('MultilevelCache not started'));
    }

    this.client.del(this.generateKey(key), function (err) {

        return callback(err);
    });
};

MultilevelCache.prototype.generateKey = function (key) {

    var k = '';

    if (this.settings.partition) {
        k += encodeURIComponent(this.settings.partition) + '!';
    }

    if (key.segment) {
        k += encodeURIComponent(key.segment) + '!';
    }

    k += encodeURIComponent(key.id);

    return k;
};

module.exports = MultilevelCache;
