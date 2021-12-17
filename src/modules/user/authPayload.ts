import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class AuthPayload {
  @Field()
  token: string;

  @Field(() => [ErrorMessage])
  errorMessages: ErrorMessage[];
}

@ObjectType()
class ErrorMessage {
  @Field()
  message: string;
}
