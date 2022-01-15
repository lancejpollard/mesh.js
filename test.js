
const attach = require('./src')

test()

async function test() {
  const graph = await attach({
    url: `postgresql://localhost:5432/postgres_graphql_test`
  })

  try {
    await graph.create({
      type: 'schema'
    })
  } catch (e) {

  } finally {
    // await graph.revoke()
    await graph.detach()
  }
}
