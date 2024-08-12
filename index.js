const express = require('express')
const app = express()
const port = 3000
const cors=require("cors")


app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { singleMedicinine } = require('./singleMedicine.get.api')
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
  const limit = parseInt(req.query.limit, 10) || 10; // Default limit is 10 if not specified
  const regex = new RegExp(term, 'i'); // Case-insensitive regex for the term

  try {
    const query = {
      $or: [
        { medicine_name: { $regex: regex } },
        { generic_name: { $regex: regex } },
        { company_name: { $regex: regex } }
      ]
    };

    const medicines = await medicine.find(query).limit(limit).toArray();

   

    const medNum = medicines.length;

    res.status(200).json({
      success: true,
      message: `${medNum} medicines found successfully`,
      data: medicines
    });
  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({
      success: false,
      message: "Something went wrong!!"
    });
  }
});

app.get("/api/v1/medicine/:id", async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);
    const query = { _id: new ObjectId(id) };
    const SingleMedicine = await medicine.findOne(query);
    if (!SingleMedicine) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Medicine retrieved successfully",
      data: SingleMedicine,
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});


app.get("/api/v1/medicines/top",async(req,res)=>{
  try{
const topMedicines=await medicine.find().sort({sold:-1}).limit(5).toArray();
const medNum = topMedicines.length; // Corrected this line to get the length of medicines
res.status(200).json({
  success: true,
  message: `${medNum} medicines found successfully`, // Corrected this line to properly format the message
  data: topMedicines
});
  }
  catch(error){
    console.error("Error fetching project:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
})

app.put("/api/v1/medicine/:id", async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);
    const {...fields } = req.body;
    const filter = { _id: new ObjectId(id) };
    const updatedBlog = { $set: { ...fields } };
    const result = await medicine.updateOne(filter, updatedBlog);
    res.status(200).json({
      success: true,
      message: "Medicine updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});


app.delete('/api/v1/medicine/:id/:field', async (req, res) => {
  const { id, field } = req.params;

  try {
    const filter = { _id: new ObjectId(id) };
    const update = { $unset: { [field]: "" } }; // Unset the field

    const updateResult = await medicine.updateOne(filter, update);

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found',
      });
    }

    res.status(200).json({
      success: true,
      message: `Field '${field}' deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting field from medicine:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong',
    });
  }
});



app.put("/api/v1/medicine/sell/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { amountSold } = req.body;

    // Validate the amountSold value
    if (!amountSold || typeof amountSold !== 'number') {
      return res.status(400).json({
        success: false,
        message: "'amountSold' must be a number",
      });
    }

    const filter = { _id: new ObjectId(id) };
    const update = { $inc: { sold: amountSold } }; // Increment the existing 'sold' field by the amountSold

    const result = await medicine.updateOne(filter, update);

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found',
      });
    }

    const updatedMedicine = await medicine.findOne(filter); // Fetch the updated document

    res.status(200).json({
      success: true,
      message: `Medicine sold field updated successfully`,
      data: updatedMedicine,  // Return the updated medicine
    });
  } catch (error) {
    console.error('Error updating sold field:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});






    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  
    app.get('/', (req, res) => {
      res.send('Welcome to MedInfo.aid 💕')
    })
    
    app.listen(port, () => {
      console.log(`MedInfo.aid listening on port ${port}`)
    })
  
  
  
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);









