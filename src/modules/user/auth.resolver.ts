import bcrypt from "bcryptjs";
import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { v4 as uuid } from "uuid";
import { isAuth } from "../../middleware/isAuth";
import { redis } from "../../redis";
import { MyContext } from "../../types/myContext";
import { sendEmail } from "../../utils/sendEmail";
import { forgotPasswordPrefix } from "./../../constants/redisPrefixes";
import { User } from "./../../entity/User";
import { createConfirmationUrl } from "./../../utils/createConfirmationUrl";
import { ChangePasswordInput, RegisterInput } from "./auth.input";

@Resolver()
export class AuthResolver {
  @UseMiddleware(isAuth)
  @Query(() => User, { nullable: true })
  async me(@Ctx() ctx: MyContext): Promise<User | null> {
    const user = await User.findOne(ctx.req.session.userId);
    if (!user) return null;
    return user;
  }

  @Mutation(() => User)
  async register(@Arg("data") registerInput: RegisterInput): Promise<User> {
    const { email, password } = registerInput;
    const emailExist = await User.findOne({ email });
    if (emailExist) {
      throw new Error("User with this email already exists.");
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = User.create({
      ...registerInput,
      password: hashedPassword,
    });
    await user.save();
    await sendEmail(user.email, await createConfirmationUrl(user.id));
    return user;
  }

  @Mutation(() => User, { nullable: true })
  async login(
    @Arg("email") email: string,
    @Arg("password") password: string,
    @Ctx() ctx: MyContext
  ): Promise<User | null> {
    let user = await User.findOne({ email });
    if (!user) {
      return null;
    }
    if (user && !(await bcrypt.compare(password, user.password))) {
      return null;
    }

    if (!user.confirmEmail) {
      return null;
    }

    ctx.req.session.userId = user.id;
    return user;
  }

  @Mutation(() => Boolean)
  async confirmUser(@Arg("token") token: string): Promise<Boolean> {
    const userId = await redis.get(token);
    if (!userId) {
      return false;
    }
    await User.update({ id: Number(userId) }, { confirmEmail: true });
    await redis.del(token);
    return true;
  }

  @Mutation(() => Boolean)
  async forgotPassword(@Arg("email") email: string): Promise<Boolean> {
    const user = await User.findOne({ email });
    if (!user) return true;

    const token = uuid();
    await redis.set(forgotPasswordPrefix + token, user.id, "ex", 60 * 60 * 24); // expires in a day

    await sendEmail(
      email,
      `http://localhost:3000/user/change-password/${token}`
    );
    return true;
  }

  @Mutation(() => User, { nullable: true })
  async changePassword(
    @Arg("data") { token, password }: ChangePasswordInput,
    @Ctx() ctx: MyContext
  ): Promise<User | null> {
    // get userId for the token
    const userId = await redis.get(forgotPasswordPrefix + token);
    if (!userId) return null;

    // find the user
    const user = await User.findOne(userId);
    if (!user) return null;
    await redis.del(forgotPasswordPrefix + token);

    // hash and save password to database
    user.password = await bcrypt.hash(password, 12);
    await user.save();

    // log the user in
    ctx.req.session.userId = user.id;

    // return user
    return user;
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() ctx: MyContext): Promise<Boolean> {
    return new Promise((resolve, reject) =>
      ctx.req.session.destroy((err) => {
        if (err) {
          console.log(err);
          return reject(false);
        }
        ctx.res.clearCookie("qid");
        return resolve(true);
      })
    );
  }
}
