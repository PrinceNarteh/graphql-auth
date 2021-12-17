import { IsEmail, IsNotEmpty } from "class-validator";
import { Field, InputType } from "type-graphql";
import { PasswordInput } from "./../../shared/passwordInput";

@InputType()
export class RegisterInput extends PasswordInput {
  @Field()
  @IsNotEmpty({ message: "First name is required." })
  firstName: string;

  @Field()
  @IsNotEmpty()
  lastName: string;

  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

@InputType()
export class ChangePasswordInput extends PasswordInput {
  @Field()
  token: string;
}
