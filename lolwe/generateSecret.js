const crypto = require('crypto');
const secret = crypto.randomBytes(32).toString('hex');
console.log(secret); // Outputs a 64-character hexadecimal string