const PORT = process.env.PORT || 3000;
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
var cors = require("cors");
const saltRounds = 10;
const myPlaintextPassword = "s0//P4$$w0rD";
const someOtherPlaintextPassword = "not_bacon";

const knex = require("knex")({
  client: "pg",

  connection: process.env.DATABASE_URL,
  ssl: true,
});
knex.connect();
const app = express();
app.use(bodyParser.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("done");
});

//posting for signin
app.post("/signin", (req, res) => {
  const { email, password } = req.body;
  knex
    //selecting the details from the login table to compare
    .select("email", "hash")
    .from("login")
    .where("email", "=", email)
    .then((data) => {
      // comparing the input password with the DB
      //data will bring an object but need the frist array there
      bcrypt.compare(password, data[0].hash, function (err, result) {
        if (result) {
          return knex
            .select("*")
            .from("users")
            .where("email", "=", email)
            .then((user) => {
              res.json("logged in");
            })
            .catch((err) => res.status(400).json("unable to get user"));
        } else {
          res.status(400).json("wrong credentials");
        }
      });
    })

    .catch((err) => {
      res.status(400).json("wrong credentials");
    });
});

//posting for register
app.post("/register", (req, res) => {
  const { name, password, email } = req.body;

  if (!email || !name) {
    return res.status(400).json("please fill the form");
  }

  bcrypt.hash(password, saltRounds, function (err, hash) {
    // Store hash in your password DB.
    //Creating a transaction
    knex
      .transaction((trx) => {
        return (
          trx
            //for the login table
            .insert({
              hash: hash,
              email: email,
            })
            .into("login")
            .returning("email")
            .then((loginEmail) => {
              //for the users table
              return trx("users")
                .returning("*")
                .insert({ name: name, email: loginEmail[0] })
                .then((user) => {
                  res.json("registered");
                });
            })
            .then(trx.commit)
            .catch(trx.rollback)
        );
      })

      .catch((err) => {
        res.status(400).json("client already exists");
      });
  });
});

//getting profile id
app.get("/profile/:id", (req, res) => {
  const { id } = req.params;

  knex
    .select("*")
    .from("users")
    .where({
      id: id,
    })
    .then((user) => {
      if (user.length) {
        res.json(user[0]);
      } else {
        res.status(400).json("not found");
      }
    })
    .catch((err) => res.status(400).json("error getting user"));
});

//posting an image
app.post("/image", (req, res) => {
  const { id } = req.body;
  let found = false;
  database.users.forEach((user) => {
    if (user.id === id) {
      found = true;
      user.entries++;
      return res.json(user.entries);
    }
  });
  if (!found) {
    res.status(400).json("not found");
  }
});

app.listen(PORT, () => {
  console.log(PORT);
});
