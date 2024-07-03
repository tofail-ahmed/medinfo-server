const express = require('express');
const app = express();
const path = require('path');

app.use((req, res, next) => {
  console.log('Middleware 1');
  console.log(`${new Date(Date.now()).toLocaleString()}-${req.method}-${req.originalUrl}-${req.protocol}`)
  next();
});

app.use((req, res, next) => {
  console.log('Middleware 2');
  next();
});
app.use((req,res,next)=>{
      console.log("middleware 3");
      next()
      // res.send("error")
})
const logData=(req,res,next)=>{
      console.log("from logData",req.url)
      next()
}
app.route("/test")
.get(logData,(req,res)=>{
      console.log("get req inside app.use")
      res.send("get req inside app.use")
})
.post((req,res)=>{
      console.log("post req inside app.use")
      res.send("post req inside app.use")
})
.put((req,res)=>{
      console.log("put req inside app.use")
      res.send("put req inside app.use")
})
.delete((req,res)=>{
      console.log("delete req inside app.use")
      res.send("delete req inside app.use")
})
app.get('/', (req, res) => {
  res.send('Hello World');
});
app.get('/index',logData, (req, res) => {
  res.sendFile(path.join(__dirname,'./index.html'));
});
app.get('/about',logData, (req, res) => {
  res.sendFile(path.join(__dirname,'./about.html'));
});
app.get('/', (req, res) => {
  res.send('Hello World');
});

app.listen(8080, () => {
  console.log('Server is running on port 8080');
});
