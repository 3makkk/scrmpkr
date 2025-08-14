import jwt, { type JwtHeader, type JwtPayload } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const client = jwksClient({ jwksUri: `${process.env.AZURE_ISSUER}/discovery/v2.0/keys` });

function getKey(header: JwtHeader, callback: (err: Error | null, key?: string) => void) {
  if (!header.kid) return callback(new Error('Missing key id'));
  client.getSigningKey(header.kid, function(err, key) {
    if (err || !key) { callback(err || new Error('No signing key')); return; }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

export function verifyToken(token: string): Promise<JwtPayload & { name?: string }> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey as any,
      {
        audience: process.env.AZURE_CLIENT_ID,
        issuer: process.env.AZURE_ISSUER,
        algorithms: ['RS256']
      },
      (err, decoded) => {
        if (err) return reject(err);
        resolve((decoded || {}) as JwtPayload & { name?: string });
      }
    );
  });
}
