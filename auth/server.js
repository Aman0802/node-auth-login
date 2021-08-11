const express = require("express");

const app = express();
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("express-flash");
const passport = require("passport");

const initializePassport = require('./passportConfig');
initializePassport(passport);

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize())
app.use(passport.session())

app.use(flash());

const PORT = process.env.PORT || 4000;

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/users/register", checkAuthenticated,(req, res) => {
  res.render("register");
});

app.get("/users/login", checkAuthenticated, (req, res) => {
  res.render("login");
});

app.get("/users/dashboard", checkNotAuthenticated,(req, res) => {
  res.render("dashboard", { user: req.user.name });
});

app.get('/users/logout', (req,res) => {
    req.logOut();
    req.flash("success_msg", "You have logged out!");
    res.redirect('/users/login')
})

app.post("/users/register", async (req, res) => {
  console.log("/user/register POST hit");
  let { email, password, name, confirmPassword } = req.body;
  let errors = [];

  if (!name || !email || !password || !confirmPassword) {
    errors.push({ message: "Please enter all fields" });
  }

  if (password.length < 6) {
    errors.push({ message: "Password should be atleast 6 characters long" });
  }

  if (password !== confirmPassword) {
    errors.push({ message: "Passwords do not match" });
  }

  if (errors.length > 0) {
    res.render("register", { errors });
  } else {
    console.log("No errors in input request");
    let hashedPassword = await bcrypt.hash(password, 10);

    pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email],
      (err, results) => {
        if (err) {
          throw err;
        }
        if (results.rows.length > 0) {
          errors.push({ message: "Email already registered" });
          res.render("register", { errors });
        } else {
          console.log("inserting the user");
          pool.query(
            "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, password",
            [name, email, hashedPassword],
            (err, results) => {
              if (err) {
                throw err;
              }
              req.flash("success_msg", "You are registered! Please Login");
              res.redirect("/users/login");
            }
          );
          console.log("user inserted successfully");
        }
      }
    );
  }
});

app.post('/users/login', passport.authenticate('local', {
    successRedirect: '/users/dashboard',
    failureRedirect: '/users/login',
    failureFlash: true
}))

function checkAuthenticated(req,res, next) {
    if(req.isAuthenticated()) {
        return res.redirect('/users/dashboard');
    }
    next()
}

function checkNotAuthenticated(req,res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    res.redirect('/users/login')
}

app.listen(PORT, () => {
  console.log("Server is running at port ", PORT);
});
