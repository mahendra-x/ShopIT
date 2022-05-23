const mongoose = require("mongoose");



const connectDatabase = () => {
    mongoose.connect(process.env.URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        
    }).then(con => {
        console.log(`mongoDb database connected with Host: ${con.connection.host}`)

    })
}

module.exports = connectDatabase