const ErrorHandler = require('../utils/errorHandler');
;


module.exports = (err, req, res, next) => {
    err.statusCode = err. statusCode || 500;
    

    if(process.env.NODE_ENV === 'DEVELOPMENT'){
        res.status(err.statusCode).json({
            success: false,
            error : err,
            errMessage: err.message,
            stack: err.stack
        })

    }
    if(process.env.NODE_ENV === 'PRODUCTION'){
        let error = {...err}

        error.message = err.message;

        // Wrong Mongoose Object ID Error
       
        if(err.name === 'CastError'){
            const message = `Resource not found. Invalid: ${err.path}`;
            error = new ErrorHandler(message, 400);
        }

        if(err.name === 'ValidatorError'){
            const message = Object.values(err.errors).map(value => value.message);
            error = new ErrorHandler(message, 400);
        }

        //Handling Mongoose Duplicate key errors

        if(err.code === 1000){
            const message = `Duplicate ${object.keys(err.keyvalue)} entered`
            error = new ErrorHandler(message, 400);
        }

        //handling wrong JWT error
        if(err.name === 'JsonWebTokenError'){
            const message = 'Json webtoken is invalid. Try Again!!!';
            error = new ErrorHandler(message, 400);
        }

         //handling Expired JWT error
         if(err.name === 'TokenExpiredError'){
            const message = 'Json webtoken is expired. Try Again!!!';
            error = new ErrorHandler(message, 400);
        }

        res.status(err.statusCode).json({
            success: false,
            message: err.message || 'Internal Server Error'
        })
    }

  
}