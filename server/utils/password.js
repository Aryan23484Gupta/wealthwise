const crypto = require("crypto");
const { promisify } = require("util");

const scrypt = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password, storedHash) {
  const [salt, originalHash] = storedHash.split(":");

  if (!salt || !originalHash) {
    return false;
  }

  const derivedKey = await scrypt(password, salt, 64);
  const originalBuffer = Buffer.from(originalHash, "hex");

  if (derivedKey.length !== originalBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(derivedKey, originalBuffer);
}

module.exports = {
  hashPassword,
  verifyPassword
};
