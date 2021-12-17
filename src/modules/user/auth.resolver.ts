import { createConfirmationUrl } from "./../../utils/createConfirmationUrl";
import { isAuth } from "../../middleware/isAuth";
import { User } from "./../../entity/User";
import bcrypt from "bcryptjs";
import {
  Mutation,
  Query,
  Resolver,
  Arg,
  Ctx,
  UseMiddleware,
} from "type-graphql";
import { RegisterInput } from "./auth.input";
import { AuthPayload } from "./authPayload";
import { MyContext } from "../../types/myContext";
import { sendEmail } from "src/utils/sendEmail";
import { redis } from "src/redis";

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

  @Mutation(() => User)
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
}
