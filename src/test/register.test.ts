import { Connection } from "typeorm";
import { gCall } from "./gCall";
import { testConnection } from "./testConnection";

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
      errorMessages {
          message
        }
      token
    }
  }
`;

describe("Register", () => {
  it("creates user", async () => {
    console.log(
      await gCall({
        source: registerMutation,
        variableValues: {
          data: {
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@email.com",
            password: "secret",
          },
        },
      })
    );
  });
});
