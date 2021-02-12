
const Hyperbee = require('hyperbee')

async function getHyperbee (opts = {}) {
  // make a new Hyperbee on top of the feed that stores string encoded keys and values.
  const config = {}
  if (opts.keyEncoding) config.keyEncoding = opts.keyEncoding
  if (opts.valueEncoding) config.valueEncoding = opts.valueEncoding
  const hyperbeeDb = new Hyperbee(opts.feed, config)
  await hyperbeeDb.ready()
  return hyperbeeDb
}

module.exports = getHyperbee
