const PORT = 8000

const express = require("express")
const cors = require("cors")
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt")

const app = express()


app.use(express.json())

app.use(
  cors({
    origin: "http://localhost:3000", // Allow requests from your frontend
  })
)

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "shopify-clone",
  password: "postgres",
  port: 5432,
});

const JWT_SECRET = "661c45285075e4b276a2dcff0e0b97ce544777f5259104a348f47ec4c35b3220";

app.post('/presignup', (req, res) => {
  try {
    const formData = req.body
    console.log("Form data is", formData)

    res.status(200).json({message: "Message submitted successfully"})
  }
  catch (err) {
    res.status(500).json({message: "Error in submitting data"})
  }
  finally {
    console.log("Message processing done")
  }
})

app.post('/login-email', async (req, res) => {
  try {
    const { email } = req.body
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email])

    if (result.rows.length > 0) {
      res.status(200).json({ message: "Email exists" , emailExists: true})
    } else {
      res.status(200).json({message: "Email doesn't exist", emailExists: false})
    }
  }
  catch (err) {
    res.status(500).json({ message: "Error checking email."})
  }
})

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body 
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email])
    if (result.rows.length > 0) {
      const user = result.rows[0]
      console.log(result.rows)
      const passwordMatch = await bcrypt.compare(password, user.password)

      if (passwordMatch) {
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' })
        res.status(200).json({ message: "Login successful", token })
      } else {
        res.status(401).json({message: "Invalid password"})
      }
    } else {
      res.status(401).json({message: "Invalid email"})
    }
    //decrypt password using bcrypt
    //if hashed password submitted & the one in db match, 
  }
  catch (err) {
    console.error(err)
    res.status(500).json({message: "Error during login"})
  }
})

app.post('/signup', async (req, res) => {
  try {
    const { email, firstname, lastname, password } = req.body 
    const hashedPassword = await bcrypt.hash(password, 10) //10 salt rounds

    const result = await pool.query(
      "INSERT INTO users (email, firstname, lastname, password) VALUES ($1, $2, $3, $4) RETURNING id",
      [email, firstname, lastname, hashedPassword]
    )

    const token = jwt.sign({ userId: result.rows[0].id, email }, JWT_SECRET, { expiresIn: '1h' })
    res.status(201).json({ message: "User created successfully", token })
    

    // hash password using bcrypt
    //insert into database. 
  } catch (err) {
    console.error(err);
    res.status(500).json({message: "Error creating user"})
  }
})

app.listen(PORT, () => {
  console.log(`Listening at port ${PORT}`)
})