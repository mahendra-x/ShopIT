const express = require("express");
const app = express();

const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const fileupload = require("express-fileupload");
const dotenv = require('dotenv');


// setting up config file
dotenv.config({ path: 'backend/config/config.env' })

const errorMiddleware = require("./middlewares/errors");

app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb',extended: true }));
app.use(bodyParser.json())
app.use(cookieParser());
app.use(fileupload({ useTempFiles: true }));
// app.use(( err, req, res, next ) => {
//     res.locals.error = err;
//     if (err.status >= 100 && err.status < 600)
//       res.status(err.status);
//     else
//       res.status(500);
//     res.render('error');
//   });



// Import all routes

const products = require("./routes/product");
const auth = require("./routes/auth");
const payment = require("./routes/payment");
const order = require("./routes/order");

app.use("/api/v1", products);
app.use("/api/v1", auth);
app.use("/api/v1", payment);
app.use("/api/v1", order);

//Middleware to handle errors
app.use(errorMiddleware);

module.exports = app;
