const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleWare
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// {
//     origin: [
//       // "https://bistro-boss-client-1.web.app",
//       // "https://bistro-boss-restaurant-server-ashy.vercel.app",
//       "http://localhost:5173",
//       "http://localhost:5000"
//     ],
//     credentials: true,
//   }

//Custom middleware
// const verifyToken = (req, res, next) => {
//   const token = req?.cookies?.token;
//   if (!token) {
//     return res.status(401).send({ message: "unauthorized access" });
//   }
//   jwt.verify(token, process.env.USER_ACCESS_TOKEN, function (err, decoded) {
//     if (err) {
//       return res.status(401).send({ message: "unauthorized access" });
//     }
//     req.user = decoded;
//     console.log(decoded)
//     next();
//   });
// };



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@cluster0.mowydsq.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();





    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);




app.get("/", (req, res) => {
  res.send("Server is Running");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
