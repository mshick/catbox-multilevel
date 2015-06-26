catbox-multilevel
=================

![npm release](https://img.shields.io/npm/v/catbox-multilevel.svg?style=flat)

Multilevel (LevelDB) adapter for [Catbox](https://github.com/hapijs/catbox).

Check out the example server to get started... (You'll need to `npm install` first)

### Features

* Fast and embedded
* Great for a simple, shared cache in a multi-process / clustered app
* Good for tests in dependent apps, since you can spin up a multilevel instance in the node environment and it comes closer to simulating something like redis than the default memory adapter
* Tests are passing at 100% coverage.

### Options

- `host` - the Multilevel server hostname. Defaults to `'localhost'`.
- `port` - the Multilevel server port or unix domain socket path. Defaults to `3000`.
- `auth` - the Multilevel authentication object when required.
- `partition` - this will store items under keys that start with this value. (Default: '')
- `sublevel` - this will store items in this sublevel. (Default: '')
- `valueEncoding` - Set to match the valueEncoding of your multilevel. Only `'json'` and `'utf8'` are supported.

### IMPORTANT

* `valueEncoding` should match your server, or you will have problems.
* Only `utf8` keyEncodings are supported.

---

Based on the [catbox-redis](https://github.com/hapijs/catbox-redis) adapter.
