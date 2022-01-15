
const net = require('net')
const CONFIG = require('./config')

async function createTCPServer({ port, ip = CONFIG.DEFAULT_IP }) {
  return new Promise((resolve) => {
    const server = net.createServer(socket => {
      server.listen(port, ip, () => {
        // socket.write('Echo server\r\n');
        // socket.pipe(socket);
        resolve(socket)
      })
    })
  })
}

async function createTCPClient({ port, ip = CONFIG.DEFAULT_IP }) {
  return new Promise((resolve) => {
    const client = new net.Socket()
    client.connect(port, ip, () => {
      resolve(client)
    })
  })
}

async function writeToTCPClient(client, { message }) {
  client.write(`${message.length}:${message}`)
}

function listenToTCPClient(client, callback) {
  client.on('data', data => {
    const i = data.indexOf(':')
    const length = Number(data.substr(0, i - 1))
    const message = JSON.parse(data.substr(i + 1, length))
    callback(message)
  })
}

function removeTCPClient(client) {
  client.destroy()
}

module.exports = {
  createTCPServer,
}
