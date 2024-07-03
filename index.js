const express = require('express')
const app = express()
const port = 3000
const cors=require("cors")


app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://medinfo:medinfo@cluster0.zhsy6ko.mongodb.net/?retryWrites=true&w=majority";

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



const db=client.db("medinfo");
const medicine=db.collection("medicines")



app.get("/api/v1/medicines", async (req, res) => {
  try {
    const medicines = await medicine.find().toArray();
    const medNum = medicines.length; // Corrected this line to get the length of medicines
    res.status(200).json({
      success: true,
      message: `${medNum} medicines found successfully`, // Corrected this line to properly format the message
      data: medicines
    });
  } catch (error) {
    console.log('error', error);
    res.status(500).json({
      success: false,
      message: "Something went wrong!!"
    });
  }
});



app.get('/api/v1/medicines/search/:term', async (req, res) => {
  const term = req.params.term;

  try {
    const query = {
      $or: [
        { medicine_name: { $regex: new RegExp(term, 'i') } },
        { generic_name: { $regex: new RegExp(term, 'i') } },
        { company_name: { $regex: new RegExp(term, 'i') } }
      ]
    };

    const medicines = await medicine.find(query).toArray();
    const medNum = medicines.length;

    res.status(200).json({
      success: true,
      message: `${medNum} medicines found successfully`,
      data: medicines
    });
  } catch (error) {
    console.log('error', error);
    res.status(500).json({
      success: false,
      message: "Something went wrong!!"
    });
  }
});







    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  
    app.get('/', (req, res) => {
      res.send('Hello World!')
    })
    
    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`)
    })
  
  
  
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);









