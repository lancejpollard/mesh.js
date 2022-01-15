
// - create central table
// - layer to create new object table
// - layer to create new property value table
// - layer to find the appropriate shard to write to
// - layer for querying across shards (graphql like requests)
// - layer for inserting records (across multiple shards)
// - function for creating a new schema (private function)
// - function for running a "migration" on graphical schema.
// - layer for connecting to all available shards (with connection pooling)

const knex = require('knex')

class Graph {
  constructor(connection) {
    this.shards = [construct(connection)]
  }

  async attach() {
    await connect(this.shards[0])
    await ensureCentralTable(this.shards[0])
  }

  async create(list) {

  }

  async update(list) {

  }

  async select(query) {

  }

  async remove(list) {

  }
}

async function attach(config) {
  const graph = new Graph(config)
  await graph.attach()
  return graph
}

function construct(connection) {
  // connection: {
  //     host: config.PGSQL_HOST,
  //     port: config.PGSQL_PORT,
  //     user: config.PGSQL_USER,
  //     password: config.PGSQL_PWD,
  //     database : config.PGSQL_DB
  // },
  const config = {
    client: 'pg',
    connection,
    useNullAsDefault: true,
  }

  return knex(config)
}

await function connect(knex) {
  await knex.raw('SELECT 1;')
  await knex.raw('SET timezone="UTC";')
}

await function ensureCentralTable(knex) {
  await ensureShardTable(knex)
  await ensureShardMappingTable(knex)
  await ensureInitialShard(knex)
}

async function ensureInitialShard(knex) {
  return await knex('shard').insert({}).returning('*')
}

async function ensureShardTable(knex) {
  const hasTable = await knex.schema.hasTable('shard')
  if (!hasTable) {
    await knex.schema.createTable('shard', t => {
      t.increments('id')
      t.string('url')
    })
  }
}

async function ensureShardMappingTable(knex) {
  const hasTable = await knex.schema.hasTable('shard_table')
  if (!hasTable) {
    await knex.schema.createTable('shard_table', t => {
      t.increments('id')
      t.integer('shard_id')
      t.integer('table_type')
      t.boolean('appendable')
    })
  }
}

module.exports = attach
