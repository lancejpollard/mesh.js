
const knex = require('knex')
const {
  ensureCenter,
  ensureBaseSchemaSet,
} = require('./ensure')
const {
  revokeCenter,
} = require('./remove')

// - create central table
// - layer to create new object table
// - layer to create new property value table
// - layer to find the appropriate shard to write to
// - layer for querying across shards (graphql like requests)
// - layer for inserting records (across multiple shards)
// - function for creating a new schema (private function)
// - function for running a "migration" on graphical schema.
// - layer for connecting to all available shards (with connection pooling)

class Graph {
  constructor({
    url,
    maxSizeOfEachDatabaseInstance = 1024 ** 4, // 1TB
  }) {
    this.name = url.split('/').pop()
    this.maxSizeOfEachDatabaseInstance = Math.floor(Math.max(1024 ** 3, maxSizeOfEachDatabaseInstance))
    this.databaseSizeCheckThreshold = Math.floor(this.maxSizeOfEachDatabaseInstance / (1024 ** 2))
    this.shards = [construct(url)]
  }

  async attach() {
    log('attaching db')
    await connect(this.shards[0])
    await ensureCenter(this.shards[0])
    await ensureBaseSchemaSet(this.shards[0])
    log('attached db')
  }

  async create(list) {

  }

  async update(list) {

  }

  async select(query) {

  }

  async remove(list) {

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
    await revokeCenter(this.shards[0])
    log('revoked db')
  }
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
  const graph = new Graph(config)
  await graph.attach()
  return graph
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

async function revokeEachShard(graph) {

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
