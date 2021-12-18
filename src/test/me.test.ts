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

const meQuery = `
  query {
    me {
      id
      firstName
      lastName
      email
    }
  }
`;

describe("Me", () => {
  it("get authenticated user", async () => {
    const user = await User.create({
      firstName: faker.name.findName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
    }).save();

    const response = await gCall({
      source: meQuery,
      userId: user.id,
    });

    expect(response).toMatchObject({
      data: {
        me: {
          id: `${user.id}`,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
      },
    });
  });
});
