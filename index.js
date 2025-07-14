const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: ["http://localhost:5173",
      'http://help-mates-e2b56.web.app',
      'http://help-mates-e2b56.firebaseapp.com'],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());



const verifyToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).send({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.decoded = decoded;

    next();
  } catch (error) {
    return res.status(403).send({ message: "Invalid Token" });
  }
};

const {
  MongoClient,
  ServerApiVersion,
  Collection,
  Db,
  ObjectId,
} = require("mongodb");
const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.zsgh3ij.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  const volunteerCollection = client
    .db("helpMates")
    .collection("volunteerCollection");
  const beVolunteerCollection = client
    .db("helpMates")
    .collection("beVolunteerCollection");

  try {
    app.post("/add-volunteer", async (req, res) => {
      const volunteer = req.body;
      const result = await volunteerCollection.insertOne(volunteer);
      res.send(result);
    });


    //get all volunteer require post
    app.get("/all-volunteer", async (req, res) => {
      const result = await volunteerCollection.find().toArray();
      res.send(result);
    });

    //volunteerCount
    app.get("/volunteer-count", async (req, res) => {
      const text = req.query.text;
      console.log(text);

      let query = {};
      if (text) {
        query = { post_title: { $regex: text, $options: "i" } };
      }

      const result = await volunteerCollection.countDocuments(query);

      res.send(result);
    });

    //search all volunteer
    app.get("/search-volunteer", async (req, res) => {
      const text = req.query.text;
      const currentPage = parseInt(req.query.currentPage) - 1;
      const itemPerPage = parseInt(req.query.itemPerPage);

      let query = {};
      if (text) {
        query = { post_title: { $regex: text, $options: "i" } };
      }

      const result = await volunteerCollection
        .find(query)
        .skip(itemPerPage * currentPage)
        .limit(itemPerPage)
        .toArray();
      res.send(result);
    });


    //sorting all volunteer
    app.get("/deadline-volunteer", async (req, res) => {
      const date = new Date().toLocaleDateString();
      console.log(date);
      const query = { deadline: -1 };
      const result = await volunteerCollection
        .find()
        .sort(query)
        .limit(6)
        .toArray();
      res.send(result);
    });


    // get all volunteer require post of a user by email
    app.get("/my-post/:email", async (req, res) => {
      const email = req.params.email;
      const query = { "organizer.email": email };
      const result = await volunteerCollection.find(query).toArray();
      res.send(result);
    });


    //delete a volunteer post
    app.delete("/post-delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await volunteerCollection.deleteOne(query);
      res.send(result);
    });

    //update a volunteer post
    app.put("/update/:id", async (req, res) => {
      const id = req.params.id;
      const volunteer = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          ...volunteer,
        },
      };

      const result = await volunteerCollection.updateOne(query, update);
      res.send(result);
    });

    //get volunteer request by user email
    //verifyTesting

    app.get("/my-request/:email", verifyToken, async (req, res) => {
      const decoded = req.decoded;
      console.log(decoded);
      const email = req.params.email;
      if (email !== decoded.email) {
        return res.status(403).send({ message: "Invalid Token" });
      }

      const query = { "volunteer.volunteer_email": email };
      const result = await beVolunteerCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/volunteer/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await volunteerCollection.findOne(query);
      res.send(result);
    });

    app.post("/be-volunteer", async (req, res) => {
      const volunteer = req.body;
      const id = req.query.id;
      const query = { _id: new ObjectId(id) };
      const update = { $inc: { need_volunteer: -1 } };
      await volunteerCollection.updateOne(query, update);
      const result = await beVolunteerCollection.insertOne(volunteer);
      res.send(result);
    });
    //delete a volunteer request
    app.delete("/request-delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await beVolunteerCollection.deleteOne(query);
      res.send(result);
    });

    //jwt token

    app.post("/jwt-token", (req, res) => {
      const { email } = req.body;
      console.log("I am hitting", email);
      const token = jwt.sign({ email }, process.env.JWT_SECRET, {
        expiresIn: "1y",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ message: "success" });
    });

    /// clear jwt token
    app.post("/logout", (req, res) => {
      console.log("hitting");
      res.clearCookie("token", { maxAge: 0 });
      res.send({ massage: "successful" });
    });

    await client.connect();

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.get("/check", (req, res) => {
  res.send("I am checking");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
// module.exports = app;
