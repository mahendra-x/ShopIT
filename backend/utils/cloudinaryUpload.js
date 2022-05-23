const cloudinary = require("cloudinary").v2;
const ErrorHandler = require("./errorHandler");
const fs = require("fs");
const dotenv = require('dotenv');
dotenv.config({ path: 'backend/config/config.env' })
const cloudUpload = async (file, folder, next) => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  let res;

  await cloudinary.uploader.upload(
    file,
    {
      folder: folder,
    },
    function (error, result) {
      if (error) {
        return next(new ErrorHandler(error.message, 500));
      }
      if (result) {
        res = result;
      }
    }
  );
  return res;
};

module.exports = cloudUpload;
