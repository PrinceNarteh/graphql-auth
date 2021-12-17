import { v4 as uuid } from "uuid";
import { redis } from "../redis";

export const createConfirmationUrl = async (
  userId: number
): Promise<string> => {
  const token = uuid();
  await redis.set(token, userId, "ex", 60 * 60 * 24); // expires in a day

  return `http://localhost:3000/user/confirm-email/${token}`;
};
