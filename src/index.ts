import "reflect-metadata";
import { ApolloServer } from "apollo-server-express";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";
import { AuthResolver } from "./modules/user/auth.resolver";

const PORT = process.env.PORT || 4000;

createConnection()
  .then(async (_connection) => {
    // instantiate express app
    const app = express();

    // adding middleware
    app.use(cors());
    app.use(morgan("dev"));

    // setup apollo server
    const apolloServer = new ApolloServer({
      schema: await buildSchema({
        resolvers: [AuthResolver],
      }),
    });
    await apolloServer.start();
    apolloServer.applyMiddleware({ app });

    app.get("/", (_req, res) => {
      res.send("Hello, World!");
    });

    app.listen(PORT, () =>
      console.log(`Server running on http://localhost:${PORT}/graphql`)
    );
  })
  .catch((error) => console.log(error));
