const app = require('./app')
const connectDatabase = require('./config/database')

const dotenv = require('dotenv');
const cloudinary = require("cloudinary");

//Handle Uncaught exceptions
process.on("uncaughtException", (err) => {
    console.log(`Error: ${err.message}`);
    console.log(`Error: ${err.stack}`);
    console.log(`shutting down the server due to Uncaught Exception`);
    process.exit(1)
})

// setting up config file
dotenv.config({ path: 'backend/config/config.env' })

// console.log(a)
// connecting to database

connectDatabase();



const server = app.listen(process.env.PORT, () => {
    console.log(`server startes on PORT: ${process.env.PORT} in ${process.env.NODE_ENV} mode.`)
    
})

//Handle Unhandled Promise Rejections

process.on("unhandledRejection", (err) => {
    console.log(`Error: ${err.stack}`);
    console.log('shutting down the server due to unhandled Promise rejection');
    server.close(() => {
        process.exit(1)
    })
})