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
    const asset = db.collection("assets");

    //* 1. getting all medicines-------------------------
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

    //* 2. getting medicines by name, company, generic------------
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

    //* 3. getting a specific medicine by id-------------------
    app.get("/api/v1/singleMedicine/:id", async (req, res) => {
      try {
        const id = req.params.id;
        // console.log(id);
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

    //* 4. getting top 20 medicines by sold-----------------------
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


    //* 5. updating a specific medicine by id
    app.put("/api/v1/medicine/:id", async (req, res) => {
      try {
        const id = req.params.id;
        // console.log(id);
        const { ...fields } = req.body;
        // console.log(req.body);

        const currentDate = new Date();
        const filter = { _id: new ObjectId(id) };
        // console.log("filter", filter);

        const updatedBlog = { $set: { ...fields, lastUpdated: currentDate } };
        const result = await medicine.updateOne(filter, updatedBlog);
        // console.log("result", result);

        if (result.matchedCount === 0) {
          return res.status(409).json({
            success: false,
            message: "Medicine not found",
          });
        }

        res.status(200).json({
          success: true,
          message: "Medicine updated successfully",
          data: result,
        });
      } catch (error) {
        console.error("Update error:", error); // Log the actual error
        res.status(409).json({
          success: false,
          message: "Internal server error",
        });
      }
    });
    

    //* 6. deleting any specific field of a specific medicine------------------
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

    //* 7.  updating or adding lastSoldDate--------------------------
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

    //* 8. updating amountSold and available amount of specific medicine by id---------------
    app.put("/api/v1/medicine/sell/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const { amountSold } = req.body;
        const ISOString = new Date().toLocaleString(); 
        const currentDate=new Date(ISOString)

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

    //* 9. getting meds with specific field-------------------
    app.get("/api/v1/withLastSold", async (req, res) => {
      try {
        // Query to find all medicines that have the 'lastSoldDate' field
        const medicinesWithLastSold = await medicine
        .find({ lastSoldDate: { $exists: true } })
        .sort({ lastSoldDate: -1 })
        .project({ medicine_name: 1, lastSoldDate: 1, _id: 1 }) // Include only 'name' and 'lastSoldDate', exclude '_id'
        .toArray();
          
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


    // * latest adde med--------
    app.get("/api/v1/latest_medicines", async (req, res) => {
      try {
        // Query to find medicines and sort by 'createdAt' field
        const latestMedicines = await medicine
          .find({ createdAt: { $exists: true } }) // Ensure 'createdAt' field exists
          .sort({ createdAt: -1 }) // Sort by 'createdAt' in descending order
          // .limit(10) // Limit to the latest 10 documents
          // .project({ medicine_name: 1, createdAt: 1, _id: 1 })
          .toArray(); // Include only 'medicine_name', 'createdAt', and '_id'



        // Count the number of medicines fetched
        const medNum = latestMedicines.length;
    
        if (medNum === 0) {
          return res.status(404).json({
            success: false,
            message: "No medicines found with the createdAt field",
          });
        }
    
        res.status(200).json({
          success: true,
          message: `${medNum} latest medicines found successfully`,
          data: latestMedicines,
        });
      } catch (error) {
        console.error("Error fetching latest medicines:", error);
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    });
    
    

   
    

    //* 10. getting latest medicines on lastSoldDate -----------------
    app.get("/api/v1/medicines/latestSold", async (req, res) => {
      try {
        const latestMedicines = await medicine
          .find({ lastSoldDate: { $exists: true } }) // Only include medicines with the lastSoldDate field
          .sort({ lastSoldDate: -1 }) // Sort by lastSoldDate in descending order (latest first)
          .limit(10) // Limit the results to the latest 20 medicines
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

    //* 11. adding new medicine-----------
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
          available,
          warnings,
          type,
          category,
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
          sold: 0, // Default sold is 0 if not provided
          available: available,
          warnings: warnings || [], // Default to empty array if not provided
          type: type,
          category: category,
          createdAt: new Date(), // Add a timestamp for when the medicine was created
          status: "approved",
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

    //* 12. deleting a medicine by id-------------
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
          return res.status(409).json({
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

    //* 21. ading a new field to all document-------
    app.put("/api/v1/addNewField", async (req, res) => {
      try {
        const result = await medicine.updateMany(
          {}, // An empty filter means it will apply to all documents
          { $set: { discount: 0.1 } } // Add the new field with its value
        );
        console.log(`${result.modifiedCount} documents were updated.`);
      } catch (error) {
        console.error("Error adding new field to all documents:", error);
      }
    });

    //* 22. finding all data containing a certain field's value-----------
    app.get("/api/v1/medByValueField", async (req, res) => {
      try {
        const { category, type } = req.query;
        console.log("category:", category);
        console.log("type:", type);
        // Build the search query dynamically based on the presence of category and/or type
        const searchQuery = {};
        console.log(searchQuery);
        if (category) {
          searchQuery.category = { $regex: category, $options: "i" };
        }
        if (type) {
          searchQuery.type = { $regex: type, $options: "i" };
        }

        if (Object.keys(searchQuery).length === 0) {
          return res.status(400).json({
            success: false,
            message: "At least one of category or type is required",
          });
        }

        // Search the database with the constructed query
        // const result = await medicine.find(searchQuery).project({
        //   _id: 1,
        //   // medicine_name: 1,
        //   // generic_name: 1,
        //   // company_name: 1,
        //   type: 1,
        //   category: 1,
        // }).toArray();
        const result = await medicine.find(searchQuery).toArray();
        res.status(200).json(result);
      } catch (error) {
        console.error("Error from medByValue API", error);
        res.status(500).json({
          success: false,
          message: "Server error",
          data: error,
        });
      }
    });

    //* suggest medicine-----------------

    app.post("/api/v1/suggestMedicine", async (req, res) => {
      try {
        const body = req.body;
        const suggestedMedicine = {
          ...body,
          status: "pending",

          alt_medicines: ["pending ", "pending ", "pending "], // Default to empty array if not provided
          description: "pending", // Default to empty string if not provided
          doses: "pending", // Default to empty string if not provided
          side_effects: ["pending ", "pending ", "pending "], // Default to empty array if not provided
          actions: "pending", // Default to empty string if not provided
          interactions: ["pending ", "pending ", "pending "], // Default to empty array if not provided
          uses: ["pending ", "pending ", "pending "], // Default to empty array if not provided
          sold: 0, // Default sold is 0 if not provided
          available: 0,
          warnings: ["pending ", "pending ", "pending "], // Default to empty array if not provided
          type: "pending",
          category: "pending",
          createdAt: new Date(), // Add a timestamp for when the medicine was created
        };
        const result = await medicine.insertOne(suggestedMedicine);
        // console.log(result);
        if (result.acknowledged === true) {
          res.status(200).json({
            success: true,
            message: "Medicine request placed succesfully for review",
            data: suggestedMedicine,
          });
        }
       
      } catch (error) {
        res.status(409).json({
          success: false,
          message: "Error occured",
          data: error,
        });
      }
    });
    


    //* adding discunt field random value
    app.put("/api/v1/addDiscountValue",async(req,res)=>{
      try{
        const discountOptions = [
          0.1, 0.2, 0.3, 0.12, 0.13, 0.23, 0.05, 0.15, 0.18, 0.25, 0.08, 0.22, 0.11,
          0.19, 0.14, 0.17, 0.09, 0.21, 0.24, 0.16,
        ];
        const meds=await medicine.find({}).toArray();
        const bulkUps=meds.map((med)=>{
          const randomDiscount=
          discountOptions[Math.floor(Math.random()*discountOptions.length)];
          return{
            updateOne:{
              filter:{_id:med._id},
              update:{$set:{discount:randomDiscount}}
            }
          }
        });
        console.log(bulkUps);
        // res.send({bulkUps})
        if (bulkUps.length > 0) {
          const result = await medicine.bulkWrite(bulkUps);
          console.log(result)
          // console.log(`${result.modifiedCount} documents were updated.`);
          res.status(200).send({
            success: true,
            message: `${result.modifiedCount} medicines updated with random discount values.`,
          });
        } else {
          res.status(200).send({
            success: true,
            message: "No medicines found to update.",
          });
        }
      }catch(error){
        res.status(404).send({
          success:false,
          message: "Failed to update medicines with random discounts."
        })
      }
    })

    //* getting top discounted medicines

    app.get("/api/v1/topDiscount",async(req,res)=>{
      try{
        const topDiscMeds=await medicine
        .find({discount:{$exists:true},status:"approved"})
        .sort({discount:-1})
        
        .limit(12)
        .toArray();
        console.log(topDiscMeds.length)
        res.status(200).send({
          success:true,
          message:"Data retrieve successfully",
          data:topDiscMeds
        })
      }catch(error){
        res.status(404).send({
          suucess:false,
          message:"error occures"
        })
      }
    })


    //*getting less stored meds
    
    app.get("/api/v1/lessStoredMeds",async(req,res)=>{
      try{
        const lessStored=await medicine
        .find({available:{$exists:true},status:"approved"})
        // .find({ available: { $exists: true } ,status: "approved"},
          //  { projection: { _id: 1, medicine_name: 1, available: 1,status:1 } }) // Use projection to include specific fields

        .sort({available:1})
        // .project({_id:1,medicine_name:1,available:1})
        .limit(6)
        .toArray();
        console.log(lessStored.length)
        res.status(200).send({
          success:true,
          message:"Data retrieve successfully",
          data:lessStored
        })
      }catch(error){
        res.status(404).send({
          suucess:false,
          message:"error occures"
        })
      }
    })


    //* getting most sold meds
    app.get("/api/v1/mostSold",async(req,res)=>{
      try{
        const mostSold=await medicine
        .find({sold:{$exists:true},status:"approved"})
        // .find({ available: { $exists: true } ,status: "approved"},
          //  { projection: { _id: 1, medicine_name: 1, available: 1,status:1 } }) // Use projection to include specific fields

        .sort({sold:-1})
        .project({_id:1,medicine_name:1,sold:1})
        .limit(6)
        .toArray();
        console.log(mostSold.length)
        res.status(200).send({
          success:true,
          message:"Data retrieve successfully",
          data:mostSold
        })
      }catch(error){
        res.status(404).send({
          suucess:false,
          message:"error occures"
        })
      }
    })





    //!--------------user routes------------------
    //* 13. ----------------------adding new user--------------
    app.post("/api/v1/register", async (req, res) => {
      try {
        const { name, email, password,imgUrl,contact,address,postalCode } = req.body;

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
        const newUser = { name, email, password: hashedPassword, role: "user",imgUrl,contact,address, postalCode};
console.log(newUser)
        // Insert the new user into the database
        const result = await user.insertOne(newUser);
        // console.log(result);
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

    //* 14. ---user role upgration----------------
    app.put("/api/v1/userRole/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { role } = req.body;
        // console.log(role);
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

    //* 15. ---------user login------------------------------

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

    //* 16. -------------------user details by email------------------------
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

    //* 17. ----------get all user------------
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

    //* 18. ---------------------delete user----------------
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

    //* 19. ------update buy or add list------------
    app.put("/api/v1/userPurchaseList/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const body = req.body;
        // console.log(body)
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

        // console.log(result);
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

    //* 20. getting single user details--------------

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

    // * updating user credetials------------
    app.put("/api/v1/updateUser/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { name, email, contact, imgUrl, postalCode, address } = req.body;
    
        const userData = {
          name,
          email,
          contact,
          imgUrl,
          address,
          postalCode
        };
    
        const updateData = { $set: userData };
        const filter = { _id: new ObjectId(id) };
        const result = await user.updateOne(filter, updateData, { upsert: true });
    // console.log(result)
        if (result.matchedCount > 0) {
          if (result.modifiedCount > 0) {
            return res.status(200).json({
              success: true,
              message: "User updated successfully",
            });
          } else {
            return res.status(200).json({
              success: true,
              message: "No changes made as the data was identical",
            });
          }
        } else if (result.upsertedCount > 0) {
          return res.status(201).json({
            success: true,
            message: "User created successfully",
            userId: result.upsertedId,
          });
        } else {
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }
      } catch (error) {
        console.error("Error updating user credentials:", error.message);
        return res.status(500).json({
          success: false,
          message: "Server error",
        });
      }
    });



    //* adding or updating user review
      app.put("/api/v1/addreview/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { review } = req.body;
    
        // MongoDB filter and update setup
        const filter = { _id: new ObjectId(id) };
        const updateData = { $set: { review } };
    
        // Update the review, and upsert if it doesn't exist
        const result = await user.updateOne(filter, updateData, { upsert: true });
    
        if (result.matchedCount === 0 && result.upsertedCount === 0) {
          return res.status(404).json({
            success: false,
            message: "Review not found and could not be created.",
          });
        }
    
        console.log("Update result:", result);
        res.status(200).json({
          success: true,
          message: result.matchedCount
            ? "Review updated successfully"
            : "Review created successfully",
          data: result,
        });
      } catch (error) {
        console.error("Error updating user review:", error.message);
        return res.status(500).json({
          success: false,
          message: "Server error",
        });
      }
    });
   

    // * adding assets-------
    app.post("/api/v1/addAsset", async (req, res) => {
      try {
        const { name, imgUrl } = req.body;
    
        // Validate required fields
        if (!name || !imgUrl) {
          return res.status(400).json({
            success: false,
            message: "Name and ImgUrl are both required!",
          });
        }

        // Check if an asset with the same name or imgUrl already exists
    const existingAsset = await asset.findOne({
      $or: [{ name: name }, { imgUrl: imgUrl }],
    });

    if (existingAsset) {
      return res.status(409).json({
        success: false,
        message: "An asset with the same name or image URL already exists!",
      });
    }
    
        // Create the new asset object
        const newAsset = {
          name,
          imgUrl,
          createdAt: new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }) // Adjust the timezone as needed

        };
    
        console.log("New asset to be added:", newAsset);
    
        // Insert the new asset into the database
        const result = await asset.insertOne(newAsset); // Assuming `asset` is your MongoDB collection
    
        // Check if the insertion was successful
        if (result.insertedId) {
          res.status(201).json({
            success: true,
            message: "New asset added successfully",
            data: { id: result.insertedId, ...newAsset }, // Include insertedId in the response
          });
        } else {
          res.status(500).json({
            success: false,
            message: "Failed to add the asset.",
          });
        }
      } catch (error) {
        console.error("Error adding assets:", error);
        res.status(500).json({
          success: false,
          message: "Internal server error.",
        });
      }
    });



   //* getting all assets--------
   app.get("/api/v1/assets", async (req, res) => {
    try {
      // Optional query support for filtering
      const filters = req.query || {};
      
      // Fetch assets with optional filters
      const result = await asset.find(filters).toArray();
      
      // If no assets are found, respond with a 404 status
      if (!result.length) {
        return res.status(404).json({
          success: false,
          message: "No assets found",
        });
      }
      
      // Respond with the found assets
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error fetching assets:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while fetching assets",
        error: error.message,
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









