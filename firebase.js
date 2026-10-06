const { initializeApp, cert } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");

const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
    credential: cert(serviceAccount),
    databaseURL: "https://job-management-system-779e0-default-rtdb.firebaseio.com"
});

const db = getDatabase();

module.exports = db;