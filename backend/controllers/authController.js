const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const User = require("../models/user");
const cloudinary = require("cloudinary");
const cloudUpload = require("../utils/cloudinaryUpload");
const fs = require("fs");
const cloudDelete = require("../utils/cloudinaryDelete");

//Register a User => /api/v1/register

exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  let images;
  let imagesLinks = [];

  if (req.body.user.avatar == null) {
    images = await cloudUpload(req.body.user[1], "avatars", next);

    imagesLinks.push({
      public_id: images.public_id,
      url: images.secure_url,
    });
  }

  const dir = "tmp";
  fs.rmdir(dir, { recursive: true }, (err) => {
    console.log(`${dir} is deleted!`);
  });

  const { name, email, password } = req.body.user[0];

  const user = await User.create({
    name,
    email,
    password,
    avatar: imagesLinks,
  });

  // const token = user.getJwtToken();

  // res.status(201).json({
  //     success: true,
  //     token
  // })

  sendToken(user, 200, res);

  // res.status(201).json({
  //   success: true,
  //   imagesLinks
  //           })
});

exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  //checks if email and password is entered by User
  if (!email || !password) {
    return next(new ErrorHandler("Please enter email & password", 400));
  }

  //finding user in database
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid Email or Password", 401));
  }

  // checks  if password is correct or not
  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Email or Password", 401));
  }

  // const token = user.getJwtToken();

  // res.status(200).json({
  //     success: true,
  //     token
  // })

  sendToken(user, 200, res);
});

// Forgot Password => /api/v1/password/forgot

exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  
  console.log("req.body.email",req.body[0].email);
  const user = await User.findOne({ email: req.body[0].email });
  console.log("user",user);

  if (!user) {
    return next(new ErrorHandler("User not found with this email", 404));
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Create reset password url

  const resetUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;

  const message = `Your password reset token is as follow:\n\n${resetUrl}\n\nIf you have not requested
     this email, then ignore it.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Welcome to Our page.",
      message,
    });
    res.status(200).json({
      success: true,
      message: `Successfully Email send to: ${user.email}`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorHandler(error.message, 500));
  }
});

// reset Password => /api/v1/password/reset: token

exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  console.log("req.params.token",req.params.token);
  const {password,confirmPassword} = req.body[0];
  console.log(password,confirmPassword);
  // Hash URL token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
    
  });

  if (!user) {
    console.log("user", user);
    return next(
      new ErrorHandler(
        "Password reset token is invalid or has been expired",
        400
      )
    );
  }

  if (password !== confirmPassword) {
    return next(new ErrorHandler("password does not match", 400));
  }

  // Setup new Password

  user.password = password;

  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendToken(user, 200, res);
});

//Get currently logged in user details => /api/v1/me

exports.getUserProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user,
  });
});

exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  console.log('request password',req.body[0].oldPassword)
  const user = await User.findById(req.user.id).select("+password");

  //Check previous user Password
  const isMatched = await user.comparePassword(req.body[0].oldPassword);

  if (!isMatched) {
    return next(new ErrorHandler("old password in incorrect"));
  }

  user.password = req.body[0].password;
  await user.save();

  sendToken(user, 200, res);
});

//Update user profile  => /api/v1/me/update

exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  console.log("req.body.user[0].avatar");
  let newUserDataUpload = [];
  let images;
  let imagesLinks = [];

  const newUserData = {
    name: req.body.user.name,
    email: req.body.user.email,
  };

  //update avatar:
  if (req.body.user[0].avatar !== "") {
    let user = await User.findById(req.user.id);
    console.log("ander", user);

    const image_id = user.avatar[0].public_id;
    // console.log("image_id", image_id);

    const res = await cloudDelete(image_id);
    // console.log("delete", res);

    if (req.body.user[0].length == null) {
      // console.log("here");
      images = await cloudUpload(req.body.user[0].avatar, "avatars", next);
      // console.log("images", images);
      imagesLinks.push({
        public_id: images.public_id,
        url: images.secure_url,
      });

      // console.log("imagesLinks", imagesLinks);

      newUserDataUpload.push({
        // email: req.body.user[0].email,
        // name: req.body.user[0].name,
        avatar: [
          {
            public_id: imagesLinks.public_id,
            url: imagesLinks.secure_url,
          },
        ],
      });
    }

    // console.log("newUserDataUpload", req.user.id, newUserDataUpload[0]);
  }

  let user = await User.findByIdAndUpdate(
    req.user.id,
    {
      email: req.body.user[0].email,
      name: req.body.user[0].name,
      avatar: imagesLinks,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
  });
});

//Logout user => /api/v1/logout
exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged out",
  });
});

//admin routes

//get all users  =? /api/v1/admin/users
exports.allUsers = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    success: true,
    users,
  });
});

//get all details  =? /api/v1/admin/user/:id
exports.getuserdetail = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`User does not found with if: ${req.params.id}`)
    );
  }
  res.status(200).json({
    success: true,
    user,
  });
});

exports.updateUser = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
});

//delete user  =? /api/v1/admin/user/:id
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`User does not found with id: ${req.params.id}`)
    );
  }

  //Remove avatar from

  await user.remove();
  res.status(200).json({
    success: true,
  });
});
