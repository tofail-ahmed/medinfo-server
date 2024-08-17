const express = require('express')
const app = express()
const port = 3000
const cors=require("cors")


app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

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


//* getting all medicines-------------------------
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


//* getting medicines by name, company, generic------------
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
//* getting a specific medicine by id-------------------
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

//* getting top 20 medicines by sold-----------------------
app.get("/api/v1/medicines/top",async(req,res)=>{
  try{
const topMedicines=await medicine.find().sort({sold:-1}).limit(20).toArray();
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
//* updating a specific medicine by id
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

//* deleting any specific field of a specific medicine------------------
app.delete('/api/v1/fieldDelete/:id/:field', async (req, res) => {
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
      message: 'Something went wrong from delete field',
    });
  }
});

//* updating or adding lastSoldDate--------------------------
app.put("/api/v1/medicine/lastSoldDate/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const currentDate = new Date().toISOString().split('T')[0]; // Get the current date in YYYY-MM-DD format

    const filter = { _id: new ObjectId(id) };
    const update = { $set: { lastSoldDate: currentDate } }; // Set or update the lastSoldDate field

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
      message: `lastSoldDate field updated successfully`,
      data: updatedMedicine, // Return the updated medicine
    });
  } catch (error) {
    console.error('Error updating lastSoldDate field:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});


//* updating amountSold of specific medicine by id---------------
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

//* getting latest medicines on lastSoldDate -----------------
app.get("/api/v1/medicines/latestSold", async (req, res) => {
  try {
    const latestMedicines = await medicine
      .find({ lastSoldDate: { $exists: true } }) // Only include medicines with the lastSoldDate field
      .sort({ lastSoldDate: -1 }) // Sort by lastSoldDate in descending order (latest first)
      .limit(20) // Limit the results to the latest 20 medicines
      .toArray();

    const medNum = latestMedicines.length;

    res.status(200).json({
      success: true,
      message: `${medNum} latest sold medicines found successfully`,
      data: latestMedicines,
    });
  } catch (error) {
    console.error("Error fetching latest sold medicines:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

//* adding nes medicine-----------
app.post("/api/v1/medicines", async (req, res) => {
  try {
    const {
      medicine_name,
      generic_name,
      company_name,
      alt_medicines,
      description,
      doses,
      side_effects,
      actions,
      interactions,
      uses,
      sold,
      warnings,
    } = req.body;

    // Validate required fields
    if (!medicine_name || !generic_name || !company_name|| !alt_medicines ) {
      return res.status(400).json({
        success: false,
        message: "Medicine name, generic name, and company name are required fields.",
      });
    }


    // Check if a medicine with the same name already exists
    const existingMedicine = await medicine.findOne({ medicine_name });
    if (existingMedicine) {
      return res.status(409).json({
        success: false,
        message: "A medicine with this name already exists.",
      });
    }

    // Create the new medicine object
    const newMedicine = {
      medicine_name,
      generic_name,
      company_name,
      alt_medicines: alt_medicines || [], // Default to empty array if not provided
      description: description || "", // Default to empty string if not provided
      doses: doses || "", // Default to empty string if not provided
      side_effects: side_effects || [], // Default to empty array if not provided
      actions: actions || "", // Default to empty string if not provided
      interactions: interactions || [], // Default to empty array if not provided
      uses: uses || [], // Default to empty array if not provided
      sold: sold || 0, // Default sold is 0 if not provided
      warnings: warnings || [], // Default to empty array if not provided
      createdAt: new Date().toISOString().split('T')[0], // Add a timestamp for when the medicine was created
    };

    // Insert the new medicine into the collection
    const result = await medicine.insertOne(newMedicine);

    res.status(201).json({
      success: true,
      message: "New medicine added successfully",
      data: newMedicine, // Return the inserted document
    });
  } catch (error) {
    console.error("Error adding new medicine:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});


//* deleting a medicine by id-------------
app.delete("/api/v1/medicineDelete/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // Validate the ID format
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid medicine ID format.",
      });
    }

    const filter = { _id: new ObjectId(id) };
    const result = await medicine.deleteOne(filter);

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Medicine deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting medicine:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
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









