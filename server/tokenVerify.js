const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({ jwksUri: `${process.env.AZURE_ISSUER}/discovery/v2.0/keys` });

function getKey(header, callback) {
  client.getSigningKey(header.kid, function(err, key) {
    if (err) { callback(err); return; }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, {
      audience: process.env.AZURE_CLIENT_ID,
      issuer: process.env.AZURE_ISSUER,
      algorithms: ['RS256']
    }, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
}

module.exports = { verifyToken };
