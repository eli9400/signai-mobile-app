const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Stripe = require("stripe");

admin.initializeApp();

const getStripe = () => {
  const secret =
    process.env.STRIPE_SECRET_KEY || functions.config()?.stripe?.secret;
  if (!secret) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Stripe secret is not configured",
    );
  }
  return Stripe(secret);
};

exports.createSetupIntent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated",
    );
  }

  const uid = context.auth.uid;
  const userRef = admin.firestore().collection("users").doc(uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new functions.https.HttpsError("not-found", "User not found");
  }

  const userData = userSnap.data() || {};
  const email = userData.email || context.auth.token?.email || undefined;
  let customerId = userData.stripeCustomerId || null;

  const stripe = getStripe();

  if (!customerId) {
    const customer = await stripe.customers.create({
      email,
      metadata: { uid },
    });
    customerId = customer.id;
    await userRef.update({ stripeCustomerId: customerId });
  }

  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    usage: "off_session",
    payment_method_types: ["card"],
  });

  return {
    clientSecret: setupIntent.client_secret,
    customerId,
  };
});
