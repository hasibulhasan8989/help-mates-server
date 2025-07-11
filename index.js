const express = require('express')
const app = express()
const cors=require('cors')
require('dotenv').config()
const port = 3000

app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion, Collection, Db, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.zsgh3ij.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});



async function run() {
    
const volunteerCollection=client.db('helpMates').collection('volunteerCollection')
const beVolunteerCollection=client.db('helpMates').collection('beVolunteerCollection')

  try {
 
  app.post('/add-volunteer',async(req,res)=>{
    const volunteer=req.body
    const result=await volunteerCollection.insertOne(volunteer)
    res.send(result)
  })
//get all volunteer require post
  app.get('/all-volunteer',async(req,res)=>{
    const result= await volunteerCollection.find().toArray()
    res.send(result)
  })
  // get all volunteer require post of a user by email
  app.get('/my-post/:email',async(req,res)=>{
    const email=req.params.email
    const query={'organizer.email':email}
    const result= await volunteerCollection.find(query).toArray()
    res.send(result)
  })
  //delete a volunteer post
  app.delete('/post-delete/:id',async(req,res)=>{
    const id=req.params.id
    const query={_id: new ObjectId(id)}
    const result=await volunteerCollection.deleteOne(query)
    res.send(result)
  })
  
  //update a volunteer post
  app.put('/update/:id',async(req,res)=>{
    console.log("update Hitting")
    const id=req.params.id
    const volunteer=req.body
    const query={_id: new ObjectId(id)}
    const update={
      $set:{
         ...volunteer
      }
    }

    const result=await volunteerCollection.updateOne(query,update)
    res.send(result)
  })

  //get volunteer request by user email
  app.get('/my-request/:email',async(req,res)=>{
    const email=req.params.email;
    const query={"volunteer.volunteer_email":email}
    const result=await beVolunteerCollection.find(query).toArray()
    res.send(result)
  })


  app.get('/volunteer/:id',async(req,res)=>{
    const id=req.params.id
    const query={_id : new ObjectId(id)} 
    const result=await volunteerCollection.findOne(query)
    res.send(result)
  })

  app.post('/be-volunteer',async(req,res)=>{
    const volunteer=req.body
    const id=req.query.id
    const query={_id: new ObjectId(id)}
    const update={$inc:{need_volunteer: -1}}
    await volunteerCollection.updateOne(query,update)
    const result=await beVolunteerCollection.insertOne(volunteer)
    res.send(result)
  })
  //delete a volunteer request
  app.delete('/request-delete/:id',async(req,res)=>{
    const id=req.params.id;
    const query={_id: new ObjectId(id)}
    const result=await beVolunteerCollection.deleteOne(query)
    res.send(query)
  })
    
    await client.connect();
   
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})