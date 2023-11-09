const express = require('express')
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cookieParser = require("cookie-parser");
const app = express()
const cors = require('cors')
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5001;

app.use(cors({
  origin: [
      'http://localhost:5173','http://localhost:5174',
      'https://food-donation-community.web.app',
      'https://food-donation-community.firebaseapp.com/'
  ],
  credentials: true
}))
app.use(express.json())
app.use(cookieParser());

// 

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.49cfwvw.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


// middlewares
const logger = (req, res, next) => {
  console.log('log info', req.method, req.url)
  next()
}

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token
  // console.log('token in the middleware', token)
  if (!token) {
      return res.status(401).send({ message: 'unauthorized access' })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
      }
      req.user = decoded
      next()
  })

}

async function run() {
  try {

    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const foodsCollection = client.db('foodsDB').collection('foods')
    const requestFoodsCollection = client.db('foodsDB').collection('requestFoods')
    const bannerCollection = client.db('foodsDB').collection('bannerImage')

    // Auth Related Api

    app.post('/jwt', async (req, res) => {
      const user = req.body
      console.log(user)
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res
          .cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', 
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          })
          .send({ success: true })
          
  })

  app.post('/logout', async (req, res) => {
      const user = req.body
      console.log('user hitten', user)
      res.clearCookie('token', { maxAge: 0,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', }).send({ success: true })
  })



    // create add foods data
    app.post('/addFoods', async (req, res) => {
      const food = req.body;
      const result = await foodsCollection.insertOne(food)
      res.send(result)
    })

    // Get all foods item
    app.get('/foods', async (req, res) => {
      const page = parseInt(req.query.page)
      const size = parseInt(req.query.size)
      const query = { status: 'available' }; 
      const result = await foodsCollection.find(query).skip(size * page).limit(size).toArray()
      res.send(result)
    })

    // to count foods
    app.get('/foodCount', async (req, res) => {
      const count = await foodsCollection.estimatedDocumentCount()
      res.send({ count })
    })

    // to get single food details
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
      const result = await foodsCollection.deleteOne(query)
      console.log(result)
      res.send(result)
    })

    // update specified user data
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
          pickupLocation: update.pickupLocation,
          expireDate: update.expireDate,
          additionalNotes: update.additionalNotes,
          category: update.category,
          donatorDesignation: update.donatorDesignation,
          foodId: update.foodId,
          donatorEmail: update.donatorEmail,
          status: update.status,

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

    // get  requested food item for specified user
    app.get('/requestedFoods', async (req, res) => {
      let query = {}
      if (req.query?.email) {
        query = { requsterEmail: req.query.email }
      }
      const result = await requestFoodsCollection.find(query).toArray()
      res.send(result)
    })

    // create delete method to cancel any food item
    app.delete('/requestedFoods/:id',async(req,res)=>{
      const id = req.params.id;
      console.log(id)
      const query = {_id: new ObjectId (id)}
      console.log(query)
      const result = await requestFoodsCollection.deleteOne(query)
      console.log(result)
      res.send(result)
    })

// update the food status
    app.patch('/updateStatus/:id',async(req,res)=>{
      const status = req.body;
      console.log(status)
      const id = req.params.id;
      console.log(id)
      const query = {_id: new ObjectId(id)}
      const updateStatus = {
        $set: {
          status:status.status
        }
      }
      console.log(updateStatus)
      const result = await foodsCollection.updateOne(query,updateStatus)
      res.send(result)
    })

   

// Get foods and request foods data by unique id
  app.get('/requestedFoods/:id',async(req,res)=>{
    const id = req.params.id;
    const singleFoods = { _id: new ObjectId(id)}
    const requestedInformation = { foodsId: id}
  
    const foods = await foodsCollection.findOne(singleFoods);
    const requests = await requestFoodsCollection.find(requestedInformation).toArray()
    res.send({foods,requests})
  })


    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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
