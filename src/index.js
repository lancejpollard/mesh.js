
const knex = require('knex')
const {
  createTCPServer,
} = require('./net')
const {
  ensureCenter,
  ensureBaseSchema,
} = require('./implementation/ensure')
const {
  createRecord,
  createRecordList,
} = require('./implementation/create')
const {
  revokeCenter,
  revokeEachPropertyTable,
} = require('./implementation/remove')
const {
  selectFromRecordTable,
  selectEveryType,
} = require('./implementation/select')

// - create central table
// - layer to create new object table
// - layer to create new property value table
// - layer to find the appropriate shard to write to
// - layer for querying across shards (primeql like requests)
// - layer for inserting records (across multiple shards)
// - function for creating a new schema (private function)
// - function for running a "migration" on primeical schema.
// - layer for connecting to all available shards (with connection pooling)

class Prime {
  constructor({
    url,
    maxSizeOfEachDatabaseInstance = 1024 ** 4, // 1TB
    base = true, // if it's the base node.
  } = {}) {
    this.name = url.split('/').pop()
    this.maxSizeOfEachDatabaseInstance = Math.floor(Math.max(1024 ** 3, maxSizeOfEachDatabaseInstance))
    this.databaseSizeCheckThreshold = Math.floor(this.maxSizeOfEachDatabaseInstance / (1024 ** 2))
    this.isBase = base

    const baseConnection = construct(url)
    this.connection = {
      base: baseConnection,
      hook: [baseConnection],
      host: [baseConnection]
    }
    this.shards = [baseConnection]
  }

  async attach() {
    log('attaching db')
    await connect(this.shards[0])
    // this.server = await listen()
    log('attached db')
  }

  async emerge() {
    log('emerging')
    await ensureCenter(this.shards[0])
    await ensureBaseSchema(this.shards[0])
    this.schema = await selectEveryType(this.shards[0])
    log('emerged')
  }

  async create(input) {
    if (Array.isArray(input)) {
      return await createRecordList(input)
    } else {
      return await createRecord(input)
    }
  }

  async update(input) {

  }

  async select(query) {
    return await selectFromRecordTable(this.shards, query)
  }

  async remove(input) {

  }

  /**
   * Check if record exists.
   */

  async assess(query) {

  }

  /**
   * Ensure a record (like a schema) exists.
   */

  async ensure(list) {

  }

  /**
   * List all shards and other metadata.
   *
   * So we know the size and scope of our system.
   */

  async survey() {

  }

  /**
   * Disconnect from the database system.
   */

  async detach() {
    log('detaching')
    await detach(this.shards[0])
    log('detached')
  }

  /**
   * Complete drop the whole database system.
   */

  async revoke() {
    log('revoking db')
    await revokeEachShard(this)
    await revokeEachPropertyTable(this.shards[0])
    await revokeCenter(this.shards[0])
    log('revoked db')
  }
}

/**
 * Listen for TCP info.
 */

async function listen({ port, ip } = {}) {
  return await createTCPServer({ port, ip })
}

function bucketChunkShard({
  organizationId,
  typeId,
  chunkId,
  max
}) {
  return (organizationId * 17 + typeId * 31 + chunkId * 5) % max
}

async function selectDatabaseSize(knex, name) {
  return await knex.raw(`SELECT pg_size_pretty(pg_database_size('${name}'));`)
}

async function selectTableSize(knex, name) {
  return await knex.raw(`SELECT pg_size_pretty(pg_total_relation_size('${name}'));`)
}

async function attach(config) {
  const prime = new Prime(config)
  await prime.attach()
  return prime
}

async function createDatabase(knex) {
  await knex.raw(`CREATE DATABASE DB_NAME;`)
}

async function detach(knex) {
  await knex.destroy()
}

async function removeDatabase(knex) {
  await knex.raw('DROP DATABASE DB_NAME;')
}

async function revokeEachShard(prime) {

}

function construct(connection, usesSSL) {
  // connection: {
  //     host: config.PGSQL_HOST,
  //     port: config.PGSQL_PORT,
  //     user: config.PGSQL_USER,
  //     password: config.PGSQL_PWD,
  //     database : config.PGSQL_DB
  // },

  // connectionString: process.env.DATABASE_URL,
  // ssl: {
  //   rejectUnauthorized: false
  // }
  const ssl = usesSSL ? { rejectUnauthorized: false } : undefined
  const config = {
    client: 'pg',
    connection: {
      connectionString: connection,
    },
    pool: {
      min: 2,
      max: 10
    }
  }

  if (ssl) {
    config.ssl = ssl
  }

  return knex(config)
}

async function connect(knex) {
  await knex.raw('SELECT 1;')
  await knex.raw('SET timezone="UTC";')
}

function log(message) {
  console.log(`pgdb: ${message}`)
}

module.exports = attach
