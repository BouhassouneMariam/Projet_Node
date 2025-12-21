import jwt, { Secret } from "jsonwebtoken";


const JWT_SECRET: Secret = process.env.JWT_SECRET ?? "dev-secret"; 

export interface AccessTokenPayload {
  sub: string;
}

export function signAccessToken(payload: AccessTokenPayload, expiresIn = 1) {
  return jwt.sign(payload as string | object | Buffer, JWT_SECRET, { expiresIn: `${expiresIn}h` });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, JWT_SECRET) as AccessTokenPayload;
}