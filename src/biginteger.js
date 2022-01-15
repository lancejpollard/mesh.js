
function getRandomBetween(min, max) {
  return BigInt(Math.random() * max - min + 1) + BigInt(min)
}

module.exports = {
  getRandomBetween,
}
