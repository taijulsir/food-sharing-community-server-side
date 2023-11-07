const express = require('express')
require("dotenv").config();
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.49cfwvw.mongodb.net/?retryWrites=true&w=majority`;

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
    // await client.connect();



    const foodsCollection = client.db('foodsDB').collection('foods')
    const requestFoodsCollection = client.db('foodsDB').collection('requestFoods')
    const bannerCollection = client.db('foodsDB').collection('bannerImage')


    // create add foods route
    app.post('/addFoods', async (req, res) => {
      const food = req.body;
      const result = await foodsCollection.insertOne(food)
      res.send(result)
    })

    // Get all foods item
    app.get('/foods', async (req, res) => {
      const page = parseInt(req.query.page)
      const size = parseInt(req.query.size)
      const result = await foodsCollection.find().skip(size*page).limit(size).toArray()
      res.send(result)
    })
    // to count data
    app.get('/foodCount', async (req, res) => {
      const count = await foodsCollection.estimatedDocumentCount()
      res.send({ count })
    })
    app.get('/foods/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await foodsCollection.findOne(query)
      res.send(result)
    })

    // Get all foods based on user
    app.get('/allFoods', async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { donatorEmail: req.query.email }
      }
      const result = await foodsCollection.find(query).toArray()
      res.send(result)
    })

    // delete specified user data
    app.delete('/allFoods/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id)
      const query = { _id: new ObjectId(id) }
      console.log(query)
      const result = await requestFoodsCollection.deleteOne(query)
      console.log(result)
      res.send(result)
    })

    // get banner images
    app.get('/banner', async (req, res) => {
      const result = await bannerCollection.find().toArray()
      res.send(result)
    })




    // update specified user data

    //  foodName, foodImage, donatorName, donatorImage, foodQuantity, pickupLocation, expireDate, additionalNotes, category, donatorDesignation,foodId,donatorEmail,status
    app.put('/updateFoods/:id', async (req, res) => {
      const update = req.body;
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const updatedDoc = {

        $set: {
          foodName: update.foodName,
          foodImage: update.foodImage,
          donatorName: update.donatorName,
          donatorImage: update.donatorImage,
          foodQuantity: update.foodQuantity,
          pickupLocation: update.rating,
          expireDate: update.expireDate,
          additionalNotes: update.additionalNotes,
          category: update.category,
          donatorDesignation: update.donatorDesignation,
          foodId: update.foodId,
          donatorEmail: update.donatorEmail,
          status: update.brandImage,

        }
      }

      const result = await foodsCollection.updateOne(query, updatedDoc, options)
      res.send(result)
    })


    // Get single foods item
    app.get('/foods/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await foodsCollection.findOne(query)
      res.send(result)
    })

    // create request foods item
    app.post('/requestFoods', async (req, res) => {
      const request = req.body;
      const result = await requestFoodsCollection.insertOne(request)
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send("Food donation community server side is running")
})
app.listen(port, (req, res) => {
  console.log(`Food donation community server is running on port: ${port}`)
})
