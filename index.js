const express = require('express')
const app = express()
const port = 3000
const cors = require("cors");
const bcrypt = require("bcrypt");

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri =
  "mongodb+srv://medinfo:medinfo@cluster0.zhsy6ko.mongodb.net/?retryWrites=true&w=majority";

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

    const db = client.db("medinfo");
    const medicine = db.collection("medicines");
    const user = db.collection("users");

    //* getting all medicines-------------------------
    app.get("/api/v1/medicines", async (req, res) => {
      try {
        const medicines = await medicine.find().toArray();
        const medNum = medicines.length; // Corrected this line to get the length of medicines
        res.status(200).json({
          success: true,
          message: `${medNum} medicines found successfully from all medicine`, // Corrected this line to properly format the message
          data: medicines,
        });
      } catch (error) {
        console.log("error", error);
        res.status(500).json({
          success: false,
          message: "Something went wrong!!",
        });
      }
    });

    //* getting medicines by name, company, generic------------
    app.get("/api/v1/medicines/search/:term", async (req, res) => {
      const term = req.params.term;
      const limit = parseInt(req.query.limit, 10) || 10; // Default limit is 10 if not specified
      const regex = new RegExp(term, "i"); // Case-insensitive regex for the term

      try {
        const query = {
          $or: [
            { medicine_name: { $regex: regex } },
            { generic_name: { $regex: regex } },
            { company_name: { $regex: regex } },
          ],
        };

        const medicines = await medicine.find(query).limit(limit).toArray();

        const medNum = medicines.length;

        res.status(200).json({
          success: true,
          message: `${medNum} medicines found successfully from search`,
          data: medicines,
        });
      } catch (error) {
        console.error("Error fetching medicines:", error);
        res.status(500).json({
          success: false,
          message: "Something went wrong!!",
        });
      }
    });
    //* getting a specific medicine by id-------------------
    app.get("/api/v1/singleMedicine/:id", async (req, res) => {
      try {
        const id = req.params.id;
        console.log(id);
        const query = { _id: new ObjectId(id) };
        const SingleMedicine = await medicine.findOne(query);
        if (!SingleMedicine) {
          return res.status(409).json({
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
        res.status(409).json({
          success: false,
          message: "Internal server error",
        });
      }
    });

    //* getting top 20 medicines by sold-----------------------
    app.get("/api/v1/medicines/top", async (req, res) => {
      try {
        const topMedicines = await medicine
          .find()
          .sort({ sold: -1 })
          .limit(20)
          .toArray();
        const medNum = topMedicines.length; // Corrected this line to get the length of medicines
        res.status(200).json({
          success: true,
          message: `${medNum} medicines found successfully`, // Corrected this line to properly format the message
          data: topMedicines,
        });
      } catch (error) {
        console.error("Error fetching project:", error);
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    });
    //* updating a specific medicine by id
    app.put("/api/v1/medicine/:id", async (req, res) => {
      try {
        const id = req.params.id;
        console.log(id);
        const { ...fields } = req.body;
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
    app.delete("/api/v1/fieldDelete/:id/:field", async (req, res) => {
      const { id, field } = req.params;

      try {
        const filter = { _id: new ObjectId(id) };
        const update = { $unset: { [field]: "" } }; // Unset the field

        const updateResult = await medicine.updateOne(filter, update);

        if (updateResult.matchedCount === 0) {
          return res.status(404).json({
            success: false,
            message: "Medicine not found",
          });
        }

        res.status(200).json({
          success: true,
          message: `Field '${field}' deleted successfully`,
        });
      } catch (error) {
        console.error("Error deleting field from medicine:", error);
        res.status(500).json({
          success: false,
          message: "Something went wrong from delete field",
        });
      }
    });

    //* updating or adding lastSoldDate--------------------------
    // app.put("/api/v1/medicine/lastSoldDate/:id", async (req, res) => {
    //   try {
    //     const id = req.params.id;
    //     // const currentDate = new Date().toISOString().split("T")[0]; //2024-09-08 // Get the current date in YYYY-MM-DD format
    //     const currentTime = new Date().toLocaleString();

    //     const filter = { _id: new ObjectId(id) };
    //     const update = { $set: { lastSoldDate: currentTime } }; // Set or update the lastSoldDate field

    //     const result = await medicine.updateOne(filter, update);

    //     if (result.matchedCount === 0) {
    //       return res.status(409).json({
    //         success: false,
    //         message: "Medicine not found",
    //       });
    //     }

    //     const updatedMedicine = await medicine.findOne(filter); // Fetch the updated document

    //     res.status(200).json({
    //       success: true,
    //       message: `lastSoldDate field updated successfully`,
    //       data: updatedMedicine, // Return the updated medicine
    //     });
    //   } catch (error) {
    //     console.error("Error updating lastSoldDate field:", error);
    //     res.status(500).json({
    //       success: false,
    //       message: "Internal server error",
    //     });
    //   }
    // });

    //* updating amountSold and available amount of specific medicine by id---------------
    app.put("/api/v1/medicine/sell/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const { amountSold } = req.body;
        const currentDate = new Date().toLocaleString(); 

        // Validate the amountSold value
        if (!amountSold || typeof amountSold !== "number") {
          return res.status(400).json({
            success: false,
            message: "'amountSold' must be a number",
          });
        }

        const filter = { _id: new ObjectId(id) };
        const update = { $set: { lastSoldDate: currentDate },
        $inc: { sold: amountSold, available: -amountSold } }; // Increment the existing 'sold' field by the amountSold

        const result = await medicine.updateOne(filter, update);

        if (result.matchedCount === 0) {
          return res.status(404).json({
            success: false,
            message: "Medicine not found",
          });
        }

        const updatedMedicine = await medicine.findOne(filter); // Fetch the updated document

        res.status(200).json({
          success: true,
          message: `Medicine sold field updated successfully`,
          data: updatedMedicine, // Return the updated medicine
        });
      } catch (error) {
        console.error("Error updating sold field:", error);
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    });

    //*getting meds with specific field-------------------
    app.get("/api/v1/withLastSold", async (req, res) => {
      try {
        // Query to find all medicines that have the 'lastSoldDate' field
        const medicinesWithLastSold = await medicine.find({ lastSoldDate: { $exists: true } }).toArray();
    
        // Log the result to check if data exists
        // console.log("Medicines found:", medicinesWithLastSold);
        // console.log(typeof medicinesWithLastSold); // should be "object"
        // console.log(Array.isArray(medicinesWithLastSold)); // should be true
        const medNum=medicinesWithLastSold.length;
        if (medicinesWithLastSold.length === 0) {
          return res.status(404).json({
            success: false,
            // message:`${medNum} latest sold medicines found successfully`,
            message: "No medicines found with the lastSoldDate field",
          });
        }
    
        res.status(200).json({
          success: true,
          message:`${medNum} latest sold medicines found successfully`,
          data: medicinesWithLastSold,
        });
      } catch (error) {
        console.error("Error fetching medicines with lastSoldDate:", error);
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

    //* adding new medicine-----------
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
        if (
          !medicine_name ||
          !generic_name ||
          !company_name ||
          !alt_medicines
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Medicine name, generic name, and company name are required fields.",
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
          createdAt: new Date().toISOString().split("T")[0], // Add a timestamp for when the medicine was created
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

    //!--------------user------------------
    //*----------------------adding new user--------------
    app.post("/api/v1/register", async (req, res) => {
      try {
        const { name, email, password } = req.body;

        // Check if a user with this email already exists
        const existingUser = await user.findOne({ email });
        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: "A user with this email already exists.",
          });
        }

        // Hash the password before saving it
        const saltRounds = 10; // You can adjust the salt rounds (more rounds = more secure, but slower)
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create a new user object with the hashed password
        const newUser = { name, email, password: hashedPassword, role: "user" };

        // Insert the new user into the database
        const result = await user.insertOne(newUser);
        console.log(result);
        // Respond with success message and the new user data
        res.status(201).json({
          success: true,
          message: "New user registered successfully",
          data: newUser, // Return the inserted document
        });
      } catch (error) {
        console.error("Error registering user:", error);
        res.status(409).json({
          success: false,
          message: "Internal server error.",
        });
      }
    });
    //*---user role upgration----------------
    app.put("/api/v1/userRole/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { role } = req.body;
        console.log(role);
        const filter = { _id: new ObjectId(id) };
        const updatedUser = { $set: { role } };
        const result = await user.updateOne(filter, updatedUser);
        res.status(200).json({
          success: true,
          message: "User role updated successfully",
          data: result,
        });
      } catch (error) {
        res.status(409).json({
          success: false,
          message: "Internal server error",
        });
      }
    });

    //*---------user login------------------------------

    app.post("/api/v1/login", async (req, res) => {
      try {
        const { email, password } = req.body;

        // Find the user by email
        const userCred = await user.findOne({ email });
        // console.log(userCred);
        // console.log(password);

        // If the user does not exist
        if (!userCred) {
          return res.status(409).json({
            success: false,
            message: "Invalid user or email🚫",
          });
        }

        // Compare the entered password with the stored hashed password
        const isMatch = await bcrypt.compare(password, userCred.password);
        // If the password is incorrect
        if (!isMatch) {
          return res.status(409).json({
            success: false,
            message: "Invalid Credentials",
          });
        }

        // If credentials are correct, respond with a success message
        return res.status(200).json({
          success: true,
          message: "Logged in successfully",
          data: userCred,
        });
      } catch (error) {
        // Handle any server errors
        console.error("Login error:", error.message);
        return res.status(409).json({
          success: false,
          message: "Login server error",
        });
      }
    });

    //*-------------------user details by email------------------------
    app.get("/api/v1/userDetails/:email", async (req, res) => {
      try {
        const { email } = req.params; // Extract email from the route parameters

        // Query the database to find the user by email
        const userCred = await user.findOne({ email });

        if (!userCred) {
          return res.status(409).json({
            success: false,
            message: "User not found",
          });
        }

        // If user is found, return user details
        res.status(200).json({
          success: true,
          data: userCred,
        });
      } catch (error) {
        // Handle any server errors
        console.error("Error fetching user by email:", error.message);
        return res.status(409).json({
          success: false,
          message: "Server error",
        });
      }
    });

    //*----------get all user------------
    app.get("/api/v1/alluser", async (req, res) => {
      try {
        const alluser = await user
          .find({}, { projection: { password: 0 } })
          .toArray();

        return res.status(200).json({
          success: true,
          message: "All users retrieved successfully",
          data: alluser,
        });
      } catch (error) {
        console.error("Error fetching users:", error.message);
        return res.status(409).json({
          success: false,
          message: "Server error",
        });
      }
    });

    //*---------------------delete user----------------
    app.delete("/api/v1/deleteUser/:id", async (req, res) => {
      try {
        const id = req.params;
        const filter = { _id: new ObjectId(id) };
        const result = await user.deleteOne(filter);
        if (result.deletedCount === 0) {
          return res.status(404).json({
            success: false,
            message: "User not found.",
          });
        }
        res.status(200).json({
          success: true,
          message: "User deleted successfully.",
        });
      } catch (error) {
        console.error("Error fetching users:", error.message);
        return res.status(409).json({
          success: false,
          message: "Server error",
        });
      }
    });

    //*------update buy or add list------------
    app.put("/api/v1/userPurchaseList/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const body = req.body;
        console.log(body)
        const currentTime = new Date().toLocaleString(); // Get current date and time

        const filter = { _id: new ObjectId(id) };

        // Define the update operation
        const update = {
          $push: {
            purchaseList: {
              ...body,
              purchasedAt: currentTime, // Add current time to the purchase object
            },
          },
        };

        // Use updateOne with $push and $setOnInsert to either push into an array or create it if it doesn't exist
        const result = await user.updateOne(filter, update, { upsert: true });

        console.log(result);
        if (result.modifiedCount !== 1 && result.upsertedCount !== 1) {
          res.status(409).json({
            success: false,
            message: "Unexpected error occurred",
          });
        }

        const updatedUser = await user.findOne(filter); // Fetch the updated document
        res.status(200).json({
          success: true,
          message: `Medicine purchased successfully`,
          data: updatedUser, // Return the updated user data
        });
      } catch (error) {
        console.error("Error updating user purchase list:", error.message);
        return res.status(409).json({
          success: false,
          message: "Server error",
        });
      }
    });

    //*getting single user details--------------

    app.get("/api/v1/singleUser/:id", async (req, res) => {
      try {
        const { id } = req.params;
    
        // Check if the id is valid before converting to ObjectId
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid ID format",
          });
        }
    
        // console.log("User ID from params:", id);
    
        const filter = { _id: new ObjectId(id) };
        const result = await user.findOne(filter, { projection: { password: 0 } });
    
        if (!result) {
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }
    
        res.status(200).json({
          success: true,
          message: "User found successfully",
          data: result,
        });
      } catch (error) {
        console.error("Error finding user:", error.message);
        return res.status(500).json({
          success: false,
          message: "Server error",
        });
      }
    });
    
    





    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    app.get("/", (req, res) => {
      res.send("Welcome to MedInfo.aid 💕");
    });

    app.listen(port, () => {
      console.log(`MedInfo.aid listening on port ${port}`);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);









