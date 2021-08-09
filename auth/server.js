const express = require("express");

const app = express();
const { pool } = require("./dbConfig");

app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: false }))

const PORT = process.env.PORT || 4000;

app.get("/", (req, res) => {
    res.render('index');
})

app.get('/users/register', (req, res) => {
    res.render('register')
})

app.get('/users/login', (req, res) => {
    res.render('login')
})

app.get('/users/dashboard', (req, res) => {
    res.render('dashboard', { user: 'Aman' })
})

app.post('/users/register', (req, res) => {
    let { email, password, name, confirmPassword } = req.body;
    let errors = [];

    console.log(email, password, name, confirmPassword)

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
        res.render('register', { errors })
    }
})

app.listen(PORT, () => {
    console.log("Server is running at port ", PORT);
})