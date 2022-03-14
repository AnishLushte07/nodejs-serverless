const { v4: uuidv4 } = require("uuid");

module.exports.generateUuid = () => {
  return uuidv4();
}
