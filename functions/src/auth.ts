import {NextFunction, Request, Response} from "express";
import {getApps, initializeApp} from "firebase-admin/app";
import {DecodedIdToken, getAuth} from "firebase-admin/auth";
import {AppUser} from "./types";
import {ApiError, normalizeEmail} from "./utils";
import {SheetsService} from "./sheets";

if (!getApps().length) {
  initializeApp();
}

export interface AuthenticatedRequest extends Request {
  firebaseUser?: DecodedIdToken;
  appUser?: AppUser;
}

export function requireAppUser(sheets: SheetsService) {
  return async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const token = parseBearerToken(req);
      const decoded = await getAuth().verifyIdToken(token);
      const email = normalizeEmail(decoded.email);
      if (!email) {
        throw new ApiError(401, "Firebase token does not include an email.");
      }
      if (!decoded.email_verified) {
        throw new ApiError(403, "Please verify your email before using the app.");
      }

      let appUser = await sheets.findUserByEmail(email);
      if (!appUser) {
        throw new ApiError(403, "User is not approved for this app.");
      }

      if (!appUser.active) {
        appUser = await sheets.activateVerifiedSignupUser(appUser);
      }

      if (!appUser.active) {
        throw new ApiError(403, "User is not approved for this app.");
      }

      req.firebaseUser = decoded;
      req.appUser = appUser;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireFirebaseUser() {
  return async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const token = parseBearerToken(req);
      const decoded = await getAuth().verifyIdToken(token);
      const email = normalizeEmail(decoded.email);
      if (!email) {
        throw new ApiError(401, "Firebase token does not include an email.");
      }

      req.firebaseUser = decoded;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function currentUser(req: AuthenticatedRequest): AppUser {
  if (!req.appUser) {
    throw new ApiError(401, "Authentication required.");
  }

  return req.appUser;
}

function parseBearerToken(req: Request): string {
  const header = req.header("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new ApiError(401, "Authorization bearer token required.");
  }

  return token;
}
