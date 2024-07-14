// import into your project pg and express
const pg = require("pg");
const express = require("express");
// instantiate the pg.Client and express server
const client = new pg.Client(
  process.env.DATABASE || "postgres://localhost/acme_ice_cream"
);
const server = express();
// function to connect to database
const init = async () => {
  await client.connect();
  console.log("connected to database");

  // create database table flavors
  let SQL = `
    DROP TABLE IF EXISTS flavors;
    CREATE TABLE flavors(
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        is_favorite BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
    );
  `;
  await client.query(SQL);
  console.log("table created");

  // insert into database table flavors
  SQL = `INSERT INTO flavors(name, is_favorite) 
  VALUES('Cookie Dough', true);
  INSERT INTO flavors(name) VALUES('Mint Chocolate Chip');
  INSERT INTO flavors(name) VALUES('Rocky Road');
  `;
  await client.query(SQL);
  console.log("seeded data");

  // make express server listen on port
  const port = process.env.port || 3000;
  server.listen(port, () => {
    console.log(`listening on port ${port}`);
  });
};
init();

// middlewares
// for post/put to convert incoming body into json to use in apis
server.use(express.json());
// morgan middleware to log requests as they come through
server.use(require("morgan")("dev"));

// CRUD endpoints
server.post("/api/flavors", async (req, res, next) => {
  try {
    const { name, is_favorite } = req.body;
    let SQL = ``;
    let response = ``;
    // set is_favorite of created flavor to false if no value is provided
    if (!is_favorite) {
      SQL = `INSERT into flavors(name, is_favorite) 
    Values($1, false) RETURNING *`;
      response = await client.query(SQL, [name]);
    } else {
      SQL = `INSERT into flavors(name, is_favorite) 
    Values($1, $2) RETURNING *`;
      response = await client.query(SQL, [name, is_favorite]);
    }

    // status 201 = create success
    res.status(201).send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

// get all flavors
server.get("/api/flavors", async (req, res, next) => {
  try {
    const SQL = `SELECT * from flavors ORDER BY created_at DESC`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

// get single flavor
server.get("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `SELECT * from flavors WHERE id=$1`;
    const response = await client.query(SQL, [req.params.id]);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

server.put("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = ``;
    const response = await client.query(SQL);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

server.delete("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `DELETE from flavors WHERE id=$1;`;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});
