import "reflect-metadata";
import { createConnection } from "typeorm";
import * as express from "express";
const PORT = process.env.PORT || 4000;

createConnection()
  .then(async (connection) => {
    const app = express();

    app.get("/", (req, res) => {
      res.send("Hello, World!");
    });

    app.listen(PORT, () =>
      console.log(`Server running on http://localhost:${PORT}/graphql`)
    );
  })
  .catch((error) => console.log(error));
