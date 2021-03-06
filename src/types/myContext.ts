import { Request, Response } from "express";
import { Session } from "express-session";

type AuthRequest = Request & {
  session?: Session & { userId: number };
};

export interface MyContext {
  req: AuthRequest;
  res: Response;
}
