import {Router} from "express";
import {AuthenticatedRequest, currentUser} from "../auth";

export function meRouter(): Router {
  const router = Router();

  router.get("/", (req: AuthenticatedRequest, res) => {
    const user = currentUser(req);
    res.json({
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      active: user.active,
      county: user.county,
      suNumber: user.suNumber,
    });
  });

  return router;
}
