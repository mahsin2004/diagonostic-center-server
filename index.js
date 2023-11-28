const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleWare
app.use(
  cors({
    origin: [
      //  "https://b8a12-server-client.web.app",
      //  "https://b8a12-server-side.vercel.app"
      "http://localhost:5173",
      "http://localhost:5000",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Custom middleware
const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.USER_ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

// Verify Admin Custom Middleware

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@cluster0.mowydsq.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection = client.db("medicalDB").collection("users");
    const bannerCollection = client.db("medicalDB").collection("banners");
    const tipsCollection = client.db("medicalDB").collection("tips");
    const testCollection = client.db("medicalDB").collection("tests");
    const bookingCollection = client.db("medicalDB").collection("bookings");

    const verifyAdmin = async (req, res, next) => {
      const email = req.user.email;
      const query = { email: email };
      const user = await bannerCollection.findOne(query);
      const isAdmin = user?.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    //Get Routes seeing user is admin or not
    app.get("/users/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.user.email) {
        return res.status(403).send({ message: "Forbidden Access" });
      }

      const query = { email: email };

      const user = await userCollection.findOne(query);
      let admin = false;

      if (user) {
        admin = user.role === "Admin";
      }

      res.send({ admin });
    });

    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    app.put("/users/:id", async (req, res) => {
      const id = req.params.id;
      const user = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateJob = {
        $set: {
          displayName: user.displayName,
          email: user.email,
          bloodGroup: user.bloodGroup,
          district: user.district,
          upazila: user.upazila,
        },
      };
      const result = await userCollection.updateOne(query, updateJob, options);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.get("/banners", async (req, res) => {
      const result = await bannerCollection.find().toArray();
      res.send(result);
    });

    // all tests loading route
    app.get("/tests", async (req, res) => {
      const result = await testCollection.find().toArray();
      res.send(result);
    });

    app.get("/tests/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await testCollection.findOne(query);
      res.send(result);
    });

    //Add a Test 
    app.post("/tests", async (req, res) => {
      const info = req.body;
      const result = await testCollection.insertOne(info);
      res.send(result);
    });


    //get Booked by email
    app.get("/bookings", async (req, res) => {
      const result = await bookingCollection.find().toArray();
      res.send(result);
    });
    app.get("/bookings/:email", async (req, res) => {
      const email = req.params.email
      const query = {email: email}
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });

    app.put("/bookings/delete/:id", async (req, res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await bookingCollection.deleteOne(query)
      res.send(result);
    });


    app.get("/tips", async (req, res) => {
      const result = await tipsCollection.find().toArray();
      res.send(result);
    });

    //Post Booking
    app.post("/bookings", async (req, res) => {
      const info = req.body;
      const result = await bookingCollection.insertOne(info);
      res.send(result);
    });

    // Post Users
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // user status update
    app.patch("/users/status/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const existingUser = await userCollection.findOne(filter);
      const newStatus = existingUser.status === "active" ? "blocked" : "active";
      const updateDoc = {
        $set: {
          status: newStatus,
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // set as role
    app.patch("/users/role/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "Admin",
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    //test Update
    app.put('/tests/update/:id', async (req, res) => {
      const id = req.params.id;
      const user = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateJob = {
        $set: {
          title: user.title, 
          image: user.image, 
          availableDates: user.availableDates, 
          shortDescription: user.shortDescription, 
          price: user.price, 
          time: user.time,
          slots: user.slots
        },
      };
        const result = await testCollection.updateOne(query, updateJob, options);
        res.json(result);
      
    });

    app.put('/tests/delete/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await testCollection.deleteOne(query);
      res.json(result);
    });

    //slots value reduces
    app.put('/tests/reduce/:id', async (req, res) => {
      const id = req.params.id;
      const user = req.body;
    
      const fieldToReduce = 'slots'; 
      const reduceValue = 1; 
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
    
      const updateJob = {
        $inc: {
          [fieldToReduce]: -reduceValue, 
        },
      };
    
   
        const result = await testCollection.updateOne(query, updateJob, options);
        res.json(result);
      
    });

    app.post("/banners", async (req, res) => {
      const user = req.body;
      const result = await bannerCollection.insertOne(user);
      res.send(result);
    });

    // Create Json Web Token
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.USER_ACCESS_TOKEN, {
        expiresIn: "365d",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });

    // Clear Json Web Token
    app.post("/logOut", async (req, res) => {
      const user = req.body;
      console.log("log out user", user);
      res
        .clearCookie("token", { maxAge: 0, sameSite: "none", secure: true })
        .send({ success: true });
    });

    // Update Route
    app.patch("/banners/admin/:id", verifyToken, async (req, res) => {
      const id = req.params.id;

      await bannerCollection.updateMany(
        { _id: { $ne: new ObjectId(id) } },
        { $set: { isActive: false } }
      );

      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          isActive: true,
        },
      };
      const result = await bannerCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Delete Route
    app.delete("/banners/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bannerCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is Running");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
