
# Postgres GraphDB

A layer above a network of Postgres shards for dealing with records modelled as graph objects.

```js
const attach = require('@lancejpollard/postgres-graphdb.js')

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
