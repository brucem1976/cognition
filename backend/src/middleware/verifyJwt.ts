import { Request, Response, NextFunction } from 'express';
import * as jose from 'jose';

const REGION = process.env.AWS_REGION || 'us-east-1';
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';

let cachedJWKS: jose.JWTVerifyGetKey | null = null;

function getJWKS(): jose.JWTVerifyGetKey {
    if (!cachedJWKS) {
        const issuer = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;
        const jwksUrl = new URL(`${issuer}/.well-known/jwks.json`);
        cachedJWKS = jose.createRemoteJWKSet(jwksUrl);
    }
    return cachedJWKS;
}

export interface AuthenticatedRequest extends Request {
    user?: jose.JWTPayload;
}

export async function verifyJwt(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Missing or invalid Authorization header' });
            return;
        }

        const token = authHeader.substring(7);

        const issuer = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;

        const { payload } = await jose.jwtVerify(token, getJWKS(), {
            issuer,
            algorithms: ['RS256'],
        });

        // Verify it's an access token (not an id token)
        if (payload.token_use !== 'access') {
            res.status(401).json({ error: 'Invalid token type' });
            return;
        }

        req.user = payload;
        next();
    } catch (err: any) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}

// Exported for testing — allows resetting the cached JWKS
export function resetJWKSCache() {
    cachedJWKS = null;
}
