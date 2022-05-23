const catchAsyncErrors = require("../middlewares/catchAsyncErrors");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

//Process stripe payments  =>  /api/v1/payment/process

exports.processPayment = catchAsyncErrors(async (req, res, next) => {
  console.log(req.body);
  const paymentIntent = await stripe.paymentIntents.create({
    description: "Software development services",
    shipping: {
      name: req.body.name,
      address: {
        line1: "510 Townsend St",
        postal_code: req.body.shippingInfo.postalCode,
        city: req.body.shippingInfo.city,
        // state: "CA",
        country: req.body.shippingInfo.country,
      },
    },
    amount: req.body.amount,
    currency: "usd",
    

    metadata: { integration_check: "accept_a_payment" },
  });

  res.status(200).json({
    success: true,
    client_secret: paymentIntent.client_secret,
  });
});

//send stripe API key  =>  /api/v1/stripeapi

exports.sendStripeApi = catchAsyncErrors(async (req, res, next) => {
  res.status(200).json({
    stripeApiKey: process.env.STRIPE_API_KEY,
  });
});
