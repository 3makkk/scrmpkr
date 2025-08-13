const http = require('http');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../tokenVerify');

const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIBOgIBAAJBAL8wY2IuWb1x1o1t4bm/FYnGV8eK3opgDdGztqKqRR3YKHy+XapF
vOLwObAun1vDLteA94ppIqhzyapMI2vlA+cCAwEAAQJBAKFdEyAJ9MkxZ7n0ANK+
wD+E/xP8L6YsJhBKt3vnDnN/SUXOcDSBx/6CkXbkqVKgf/mBlC9ZwTe74MkRUYw4
wHECIQD7NysGEKMluSleqrs9jwELyhl725LLJoPLD114F8nGKwIhAMbs6k8ZZrgu
iSu2Ce279b9Ec/WWEDuJeayQMZT6ZX0hAiA4xngk6VwBEm90LkAMPx/+qvOB0fOk
dr2qxd6Q671OawIhAKj3N6zGyF/F7fs/3Gzdh0dX8GZFODdgNpTi27C/medhAiBi
mHgNsx3Rp3XIan+FJxuxMxDPZWS9Vyuk3F7S3w7Dtw==
-----END RSA PRIVATE KEY-----`;

const publicKey = `-----BEGIN RSA PUBLIC KEY-----
MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAL8wY2IuWb1x1o1t4bm/FYnGV8eK3opg
DdGztqKqRR3YKHy+XapFvOLwObAun1vDLteA94ppIqhzyapMI2vlA+cCAwEAAQ==
-----END RSA PUBLIC KEY-----`;

function startJwksServer(port){
  const jwks = { keys:[{ kty:'RSA', kid:'test', use:'sig', n:'vMGMibF7dcW1t4bm_FYnGV8eK3opgDdGztqKqRR3YKHy-XapFvOLwObAun1vDLteA94ppIqhzyapMI2vlA-c', e:'AQAB' }]};
  const server = http.createServer((req,res)=>{
    if(req.url.endsWith('/keys')){
      res.writeHead(200,{ 'Content-Type':'application/json'});
      res.end(JSON.stringify(jwks));
    }
  });
  return new Promise(resolve=> server.listen(port, ()=>resolve(server)));
}

test('verifies token', async () => {
  const port = 5055;
  process.env.AZURE_CLIENT_ID = 'client';
  process.env.AZURE_ISSUER = `http://localhost:${port}`;
  const server = await startJwksServer(port);
  const token = jwt.sign({ sub:'123', name:'Test' }, privateKey, { algorithm:'RS256', audience:'client', issuer:process.env.AZURE_ISSUER, header:{kid:'test'} });
  const payload = await verifyToken(token);
  expect(payload.sub).toBe('123');
  server.close();
});
