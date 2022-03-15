
const slsw = require('serverless-webpack');

module.exports = {
    target: "node",
    mode: "production",
    entry: slsw.lib.entries
}