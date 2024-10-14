// insertStudents.js

const admin = require("firebase-admin");
const fs = require("fs");
require("dotenv").config();

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Load student data from JSON file
const students = JSON.parse(fs.readFileSync("students.json", "utf-8")); // Ensure the correct path to your saved JSON

// Function to insert students into Firestore
async function insertStudentsToFirestore(students) {
  const batch = db.batch(); // Batch writes for efficient insertion

  students.forEach((student) => {
    const studentRef = db.collection("students").doc(); // Create a new document for each student
    batch.set(studentRef, student);
  });

  await batch.commit();
  console.log(`Inserted ${students.length} students into Firestore.`);
}

// Run the insert function
insertStudentsToFirestore(students)
  .then(() => {
    console.log("All students have been inserted successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error inserting students:", error);
    process.exit(1);
  });
