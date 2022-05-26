const express = require('express');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');

//middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USR}:${process.env.DB_PASS}@cluster0.gcblq.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  await client.connect();
  console.log('db connected');

  //collections
  const toolsCollection = client.db('autoFin').collection('tools');

  try {
    /**
     * get all products
     * link: http://localhost:5000/products
     */
    app.get('/products', async (req, res) => {
      const query = {};
      const result = await toolsCollection.find(query).toArray();
      res.send(result);
    });

    /**
     * post product
     * link: http://localhost:5000/product
     */
    app.post('/product', async (req, res) => {
      const product = req.body;
      const result = await toolsCollection.insertOne(product);
      res.send(result);
    });

    /**
     * get single product
     * link: http://localhost:5000/product/:id
     */
    app.get('/product/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: ObjectId(id) };
      const result = await toolsCollection.findOne(query);
      res.send(result);
    });

    /**
     * user dashboard items
     * link: http://localhost:5000/myOrders/email
     */
    app.get('/myOrders', async (req, res) => {
      const query = { email: req.query.email };
      console.log(query);
      const myOrders = await toolsCollection.find(query).toArray();
      res.send(myOrders);
    });
  } finally {
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.listen(port, () => {
  console.log(`Listening to port: ${port}`);
});
