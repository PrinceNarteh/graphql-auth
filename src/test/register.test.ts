import { Connection } from "typeorm";
import { gCall } from "./gCall";
import { testConnection } from "./testConnection";
import faker from "faker";
import { User } from "../entity/User";

// connection variable
let conn: Connection;

beforeAll(async () => {
  conn = await testConnection();
});

afterAll(async () => {
  await conn.close();
});

const registerMutation = `
  mutation Register($data: RegisterInput!) {
    register(data: $data) {
      id
      firstName
      lastName
      email
    }
  }
`;

describe("Register", () => {
  it("creates user", async () => {
    const user = {
      firstName: faker.name.findName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
    };
    const response = await gCall({
      source: registerMutation,
      variableValues: {
        data: user,
      },
    });

    expect(response).toMatchObject({
      data: {
        register: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
      },
    });

    const dbUser = await User.findOne({ where: { email: user.email } });
    expect(dbUser?.confirmEmail).toBeFalsy();
    expect(dbUser?.firstName).toBe(user.firstName);
    expect(dbUser?.lastName).toBe(user.lastName);
    expect(dbUser?.email).toBe(user.email);
  });
});
