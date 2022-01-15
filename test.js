
const attach = require('./src')

test()

async function test() {
  const weave = await attach({
    url: `postgresql://localhost:5432/postgres_graphql_test`
  })

  try {
    await weave.create({
      type: 'schema'
    })
    console.log(weave.schema)
  } catch (e) {

  } finally {
    await weave.revoke()
    await weave.detach()
  }
}
