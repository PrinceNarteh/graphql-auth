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
import { RegisterInput } from "./auth.input";
import { AuthPayload } from "./authPayload";

@Resolver()
export class AuthResolver {
  @UseMiddleware(isAuth)
  @Query(() => String)
  hello() {
    return "Hello, World!";
  }

  @Mutation(() => AuthPayload)
  async register(
    @Arg("data") registerInput: RegisterInput
  ): Promise<AuthPayload> {
    const { email, password } = registerInput;
    const emailExist = await User.findOne({ email });
    if (emailExist) {
      return {
        token: "",
        errorMessages: [
          {
            message: "User with this email already exists.",
          },
        ],
      };
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = User.create({
      ...registerInput,
      password: hashedPassword,
    });
    await user.save();
    await sendEmail(user.email, await createConfirmationUrl(user.id));
    return {
      token: "This is the token",
      errorMessages: [],
    };
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
}
