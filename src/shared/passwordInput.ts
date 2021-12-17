import { MinLength } from "class-validator";
import { Field, InputType } from "type-graphql";

@InputType()
export class PasswordInput {
  @Field()
  @MinLength(6)
  password: string;
}
