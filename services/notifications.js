const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

//notifications
const sendNotification = async (topic, title, message) => {
  try {
    const payload = {
      notification: {
        title: title,
        body: message,
      },
      android: {
        priority: "high",
        notification: {
          sound: "default", // Set sound here for Android
          channelId: "high_importance_channel", // Optional: create channel for heads-up notification
          priority: "max", // Set to max for heads-up notifications
          visibility: "public",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default", // Set sound here for iOS
            alert: {
              title: title,
              body: message,
            },
          },
        },
      },
      topic: topic,
    };

    await admin.messaging().send(payload);
    return true;
  } catch (error) {
    console.error("❌ Error sending notification:", error);
    return false;
  }
};
module.exports = { sendNotification };