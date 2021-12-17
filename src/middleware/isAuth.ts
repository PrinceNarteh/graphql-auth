import { MyContext } from "../types/myContext";
import { MiddlewareFn } from "type-graphql";

export const isAuth: MiddlewareFn<MyContext> = async ({ context }, next) => {
  if (!context.req.session.userId) {
    return new Error("Not authenticated");
  }
  return next();
};
