// const  singleMedicinine=()=>{
//       async (req, res) => {
//             try {
//               const id = req.params.id;
//               console.log(id);
//               const query = { _id: new ObjectId(id) };
//               const SingleMedicine = await medicine.findOne(query);
//               if (!SingleMedicine) {
//                 return res.status(404).json({
//                   success: false,
//                   message: "Project not found",
//                 });
//               }
//               res.status(200).json({
//                 success: true,
//                 message: "Medicine retrieved successfully",
//                 data: SingleMedicine,
//               });
//             } catch (error) {
//               console.error("Error fetching project:", error);
//               res.status(500).json({
//                 success: false,
//                 message: "Internal server error",
//               });
//             }
//           }
// }
// export default singleMedicinine;