catbox-multilevel
=================

Multilevel (LevelDB) adapter for (Catbox) [https://github.com/hapijs/catbox].

Check out the example server to get started... (You'll need to `npm install` first)

### Options

- `host` - the Multilevel server hostname. Defaults to `'localhost'`.
- `port` - the Multilevel server port or unix domain socket path. Defaults to `3000`.
- `auth` - the Multilevel authentication object when required.
- `partition` - this will store items under keys that start with this value. (Default: '')
- `sublevel` - this will store items in this sublevel. (Default: '')
- `valueEncoding` - Set to match the valueEncoding of your multilevel. Only `'json'` and `'utf8'` are supported.

### IMPORTANT

`valueEncoding` should match your server, or you will have problems.

### ALSO IMPORTANT

Only `utf8` keyEncodings are supported.

---

Based on the (catbox-redis) [https://github.com/hapijs/catbox-redis] adapter.
