
# Postgres GraphDB

A layer above a network of Postgres shards for dealing with records modeled as graph objects.

```js
const attach = require('@lancejpollard/pgdb.js')

const graph = await attach({
  initialconnectionurl
})

graph.create()
graph.update()
graph.remove()
graph.select({ graphqllikequery })
graph.survey() // get list of shards
await graph.commit(async () => {
  graph.create()
  graph.update()
})
```

## Architecture

The (org, type, source, shard) is a key for an object.

- 1 central one of these
  - table table (what table is for what type of thing)
    - type (decimal, link, agent, action, etc.)
    - shard
    - address (where computer is)
    - appendable (if we can add to it, i.e. if it's not full yet)
- n of these shards
  - object table
    - org (integer)
    - type (integer)
    - shard (integer)
    - source (biginteger)
  - property tables
    - attachment (bucket is <shard>, folder is org/type/source/property/value)
      - object-org
      - object-type
      - object-shard
      - object-source
      - index (-1 for non-list items)
      - property (integer)
      - bucket
      - value (id, biginteger)
    - char (can be searched against as key)
      - org
      - type
      - shard
      - source
      - index (-1 for non-list items)
      - property (integer)
      - value (char, 255)
    - text (cannot be searched against as key)
      - org
      - type
      - shard
      - source
      - index (-1 for non-list items)
      - property (integer)
      - value (text)
    - decimal
    - integer
    - boolean
    - timestamp
    - attachment (s3 bucket name, plus object id)
    - link table (has org, type, source for link, "data binding")
      - object-org
      - object-type
      - object-shard
      - object-source
      - index (-1 for non-list items)
      - property (integer)
      - value-org
      - value-type
      - value-shard
      - value-source
      - is-deleted
    - object table

### Property Types

smallinteger

- attachment: 0
- char: 1
- text: 2
- decimal: 3
- integer: 4
- boolean: 5
- timestamp: 6
- link: 7
- object: 8

### Integral Tables

- type: 0 (schema table)
  - id-seeder (integer used for seeding the id generator)
- property: 1 (property table)
  - slug
  - title
  - type
  - islist
  - validation-list
  - formatter-list
- organization: 2
  - slug
  - title
  - image
  - logo
- person: 3
- bot: 4
- membership: 5
- invite: 6
- agent: 7
  - guest (unregistered agent, try to track though)
  - session token
  - email
  - password-salt
  - password-hash
- action: 8
  - type (create, update, delete)
  - timestamp
  - agent
  - agent-shard
  - (org, type, shard, source, property, value)
- vote: 9
  - type (flag, agreement, disagreement)
  - action-id
  - action-shard
- shards-for-type: 10 (where to search for all the records)
  - type
  - shard

## Algorithms

Should probably use a [two-phase commit](https://dropbox.tech/infrastructure/cross-shard-transactions-at-10-million-requests-per-second) to do transactions.

### Insertion

Every few records inserted, it checks the database size to see if it is close to MAX in size. Once it is close to MAX in size, it spawns off another shard.

`table_${org_id}_${type_id}` is the table name, within a shard.

/:org/:type/:object/:shard

Then, each table has an id which is a bigint.

1 billion bytes in 1 GB. 1000 billion bytes, 1 terabyte.

There are `(256**4)/2 = 2147483648` possible ids (2,147,483,648), 2 billion basically.

Let's say there are 2 billion shards _across all possible organizations_. If there are 2 billion organizations, that is a limit of 1 shard per organization (2 billion records essentially per organization per type, but since 2 billion records will essentially fill up a database instance, that is a limit of 2 billion records). So we need to allow for unlimited shards.

A shard then can be defined by an array of 2 billion-sized integers, like [214748, 83648]. The first one will go to the first layer of shards in the tree. The next will go to the next shard in the tree.

In the same light, there should be unlimited amounts of organizations, so not just 2 billion.

A solution for the near term is to just use bigints for the orgs and shards, that is enough for the foreseeable future. That way, we have 1 column instead of a column system for linking records, and instead of a shard tree, just a flat layer of shards.

- org = bigint
- type = int
- object = int
- shard = bigint

Let's say there is a limit to 32,767 (smallint) tables per shard. Let's say someone has 1 table, with 1000 records, but then the database instance runs out of space. We should move that table to another database. But actually, no because that would change the IDs. Worst case is that there is 1 record per shard across 1 million shards. So we need a way to be able to migrate the data in reality, to keep it localized.

One way is to have a map between a "chunking" integer per organization per type, and map that to a shard.

- id (map id)
- chunk_id (bigint)
- type_id (int)
- organization_id (bigint)

But lets say we can solve that problem in 10 years if we ever reach that point, which will simplify the initial design. So then we have:

- org = int
- type = int
- chunk = int
- object = int

And we can have a single database forwarding instance (all records in memory) telling us what the shard location is given a shard id.

The chunk for an org would then get mapped to a shard/instance.

- chunk_shard
  - org_id
  - type_id
  - chunk_id
  - shard_url

But that table itself could grow to let's say 1 million orgs, each with 1 million shards, that is too many to fit into one table.

So then we'd shard this table, basing it on some sort of hashing/bucketing algorithm given the array of integers. That would mean the first layer would tell us which shard we need to go to to find the lookup table.

You could also build an in-memory trie on one instance that could potentially hold all of this info in memory.

int ** 3

1111111111111111111111111111111 == 2147483647 (31 binary nodes)

3 deep array with that many items each.

Or triple hashing function.

type/chunk/chunk/chunk/record

org(bigint)/type(int)/chunk(bigint)/record

That should be enough records to be okay until we replace the system.

- chunk_shard (not guaranteed to be on the first computer)
  - org_id
  - type_id
  - chunk_id
  - shard_url
- chunk_shard_shard (guaranteed to be on the first computer)
  - id
  - shard_url

Start with chunk_shard and chunk_shard_shard on the same instance. The shard_url in that case is null, because it is the same one as the computer. Once the database instance grows too large, a new one is spawned, and the chunk_shard is added to.

Or, forget that, let's just say there is a preprocessor node.

The node has chunk_shard and chunk_shard_shard on it. When one shard fills up to the brim, a new one is added. But the old one remains. So you hash the input, get the shard url (or null), lookup the chunk shard with the input, get the url (which is null or not). Then we do the lookup on that shard. All records go through this system.
