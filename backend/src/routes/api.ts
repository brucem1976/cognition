import { Router } from 'express';
import { verifyJwt, AuthenticatedRequest } from '../middleware/verifyJwt';

const router = Router();

// GET /api/me — sample protected endpoint
router.get('/me', verifyJwt, (req: AuthenticatedRequest, res) => {
    res.json({
        sub: req.user?.sub,
        username: req.user?.username,
        tokenUse: req.user?.token_use,
        scope: req.user?.scope,
    });
});

export { router as apiRouter };
