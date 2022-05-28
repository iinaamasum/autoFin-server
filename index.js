const express = require('express');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
var jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_KEY);

//middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { query } = require('express');
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
  const usersSelectedCollection = client.db('autoFin').collection('usersData');
  const reviewCollection = client.db('autoFin').collection('review');
  const usersCollection = client.db('autoFin').collection('userData');

  try {
    /**
     * JWT token post api
     * link-local: http://localhost:5000/login
     */
    app.post('/login', async (req, res) => {
      const loggedUser = req.body;
      const token = jwt.sign(loggedUser, process.env.ACCESS_TOKEN_KEY, {
        expiresIn: '10h',
      });

      res.send({ token });
    });

    /**
     * verifyToken function section
     */
    const verifyToken = (req, res, next) => {
      const author = req.headers.author;
      if (!author) {
        return res
          .status(401)
          .send({ name: 'NoToken', message: 'Unauthorized Access' });
      }
      const token = author.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_KEY, (error, decoded) => {
        if (error) {
          return res
            .status(403)
            .send({ name: 'WrongToken', message: 'Forbidden Access' });
        }
        req.decoded = decoded;
        next();
      });
    };

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
    app.post('/tools', async (req, res) => {
      const product = req.body;
      const result = await toolsCollection.insertOne(product);
      res.send(result);
    });

    /**
     * delete product
     * link: http://localhost:5000/product/id
     */
    app.delete('/product/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await toolsCollection.deleteOne(filter);
      res.send(result);
    });

    /**
     * post product
     * link: http://localhost:5000/product
     */
    app.post('/product', async (req, res) => {
      const product = req.body;
      const result = await usersSelectedCollection.insertOne(product);
      res.send(result);
    });
    /**
     * update product
     * link: http://localhost:5000/product/${_id}
     */
    app.put('/product/:id', async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };

      const newData = {
        $set: updatedData,
      };

      const result = await toolsCollection.updateOne(filter, newData, options);

      res.send(result);
    });

    /**
     * get single product
     * link: http://localhost:5000/product/:id
     */
    app.get('/product/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await toolsCollection.findOne(query);
      res.send(result);
    });

    /**
     * delete single product
     * link: http://localhost:5000/product/:id
     */
    app.delete('/product/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await usersSelectedCollection.deleteOne(query);
      res.send(result);
    });

    /**
     * get all users selected items
     * link: http://localhost:5000/usersOrder
     */
    app.get('/usersOrder', async (req, res) => {
      const query = {};
      const result = await usersSelectedCollection.find(query).toArray();
      res.send(result);
    });

    /**
     * get user selected data via id
     * link: http://localhost:5000/usersOrder/${id}
     */
    app.get('/usersOrder/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await usersSelectedCollection.findOne(query);
      res.send(result);
    });

    /**
     * user dashboard items
     * link: http://localhost:5000/myOrders/email
     */
    app.get('/myOrders', verifyToken, async (req, res) => {
      const decodedEmail = req.decoded.email;
      if (req.query.email === decodedEmail) {
        const query = { email: req.query.email };
        const myOrders = await usersSelectedCollection.find(query).toArray();
        res.send(myOrders);
      } else {
        res
          .status(403)
          .send({ name: 'WrongToken', message: 'Forbidden Access' });
      }
    });

    /**
     * user dashboard item update
     * link: http://localhost:5000/myOrders/email
     */
    app.put('/usersOrder/:id', async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };

      const newData = {
        $set: updatedData,
      };

      const result = await usersSelectedCollection.updateOne(
        filter,
        newData,
        options
      );

      res.send(result);
    });

    /**
     * user dashboard items
     * link: http://localhost:5000/payment
     */

    app.post('/payment', async (req, res) => {
      const { price } = req.body;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card'],
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    });

    /**------------------------------------------------------------- */
    /**
     * get all review
     * link: http://localhost:5000/review
     */
    app.get('/review', async (req, res) => {
      const query = {};
      const result = await reviewCollection.find(query).toArray();
      res.send(result);
    });

    /**
     * post a review
     * link: http://localhost:5000/review
     */
    app.post('/review', async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });

    /**--------------------------------------------------------------- */
    /**
     * user info get
     * link: http://localhost:5000/user
     */
    app.get('/user/:email', async (req, res) => {
      const query = { email: req.params.email };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    /**
     * get all user info
     * link: http://localhost:5000/user
     */
    app.get('/user', async (req, res) => {
      const query = {};
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    /**
     * user info upsert
     * link: http://localhost:5000/user/${email}
     */
    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const updatedData = req.body;
      const filter = { email: email };
      const options = { upsert: true };

      const newData = {
        $set: updatedData,
      };

      const result = await usersCollection.updateOne(filter, newData, options);

      res.send(result);
    });

    /**
     * make admin api
     * link: http://localhost:5000/user/${email}
     */
    app.put('/userAdmin/:email', async (req, res) => {
      const email = req.params.email;
      const updatedData = req.body;
      // console.log(updatedData, email);
      const filter = { email: email };
      const options = { upsert: true };

      const newData = {
        $set: updatedData,
      };

      const result = await usersCollection.updateOne(filter, newData, options);

      res.send(result);
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
