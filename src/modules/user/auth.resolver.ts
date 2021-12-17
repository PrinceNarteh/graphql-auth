import { User } from "./../../entity/User";
import bcrypt from "bcryptjs";
import { Mutation, Query, Resolver, Arg } from "type-graphql";
import { RegisterInput } from "./auth.input";
import { AuthPayload } from "./authPayload";

@Resolver()
export class AuthResolver {
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
    return {
      token: "This is the token",
      errorMessages: [],
    };
  }
}
