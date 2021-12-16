import { Field, InputType } from "type-graphql";
import { IsNotEmpty, IsEmail, MinLength } from "class-validator";

@InputType()
export class RegisterInput {
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

  @Field()
  @MinLength(6)
  password: string;
}
