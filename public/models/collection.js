import mongoose from "mongoose";

await mongoose.connect("mongodb://localhost:27017/RegisterUser")
.then(()=>{
  console.log('mongoose connected');
})
.catch((e)=>{
  console.log('failed');
})


const CollectionSchema = new mongoose.Schema({
  Name :String,

  ContactNo :String,
 
  Password :String,
 
  });

export const Collection  = mongoose.model('Collection', CollectionSchema); 