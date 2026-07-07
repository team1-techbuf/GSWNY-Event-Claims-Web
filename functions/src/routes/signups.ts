import {Router} from "express";
import {z} from "zod";
import {AuthenticatedRequest} from "../auth";
import {SheetsService} from "../sheets";
import {ApiError, normalizeEmail} from "../utils";

const signupSchema = z.object({
  fullName: z.string().trim().max(120).optional().default(""),
});

export function signupsRouter(sheets: SheetsService): Router {
  const router = Router();

  router.post("/", async (req: AuthenticatedRequest, res, next) => {
    try {
      const firebaseUser = req.firebaseUser;
      const email = normalizeEmail(firebaseUser?.email);
      if (!email) {
        throw new ApiError(401, "Firebase token does not include an email.");
      }

      const parsed = signupSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        throw new ApiError(400, "Invalid signup request.");
      }

      const user = await sheets.ensureSignupUser({
        email,
        fullName: parsed.data.fullName,
      });

      res.status(user.active ? 200 : 201).json({
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        active: user.active,
        county: user.county,
        suNumber: user.suNumber,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
