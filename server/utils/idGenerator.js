const crypto = require("crypto");

function generateCustomId(length = 28) {
  // Generate Firebase-like IDs
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.randomBytes(length);
  let result = "";

  for (let i = 0; i < length; i++) {
    result += charset[bytes[i] % charset.length];
  }

  return result;
}

module.exports = {
  generateCustomId,
};
