import { User } from "./../../entity/User";
import bcrypt from "bcryptjs";
import { Mutation, Query, Resolver, Arg } from "type-graphql";
import { RegisterInput } from "./auth.input";

@Resolver()
export class AuthResolver {
  @Query(() => String)
  hello() {
    return "Hello, World!";
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
    return user;
  }
}
