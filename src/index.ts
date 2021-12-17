import "reflect-metadata";
import cors from "cors";
import express from "express";
import session from "express-session";
import morgan from "morgan";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";
import { ApolloServer } from "apollo-server-express";
import { AuthResolver } from "./modules/user/auth.resolver";
import connectRedis from "connect-redis";
import { redis } from "./redis";

const PORT = process.env.PORT || 4000;
let RedisStore = connectRedis(session);

createConnection()
  .then(async (_connection) => {
    // instantiate express app
    const app = express();

    // adding middleware
    app.use(
      cors({
        credentials: true,
        origin: "http://localhost:3000",
      })
    );
    app.use(morgan("dev"));
    app.use(
      session({
        store: new RedisStore({
          client: redis,
        }),
        name: "qid",
        secret: "secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
          httpOnly: true,
          secure: process.env.NODE_ENV == "production",
          maxAge: 1000 * 60 * 60 * 24 * 7 * 365,
        },
      })
    );

    // setup apollo server
    const apolloServer = new ApolloServer({
      schema: await buildSchema({
        resolvers: [AuthResolver],
      }),
      context: ({ req }) => {
        return {
          req,
        };
      },
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
