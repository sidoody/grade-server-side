const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai"); // Import the correct OpenAI class from the SDK
require("dotenv").config(); // For environment variables (API key)
const admin = require("firebase-admin");

// Firebase Configuration
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// Service account is now directly parsed from environment variables

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/firebase-config", (req, res) => {
  try {
    const firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
    };

    if (!firebaseConfig.apiKey) {
      throw new Error(
        "Firebase configuration is missing in environment variables.",
      );
    }

    res.status(200).json(firebaseConfig);
  } catch (error) {
    console.error("Error fetching Firebase configuration:", error.message);
    res.status(500).json({ error: "Failed to fetch Firebase configuration." });
  }
});
// OpenAI Configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Securely load API key from environment variables
});

// API route to fetch all student submissions (from Firestore)
app.get("/api/fetch-students", async (req, res) => {
  try {
    const studentsSnapshot = await db.collection("students").get();
    const students = studentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(students);
  } catch (error) {
    console.error("Error fetching students:", error.message);
    res.status(500).json({ error: "Failed to fetch students." });
  }
});

// Helper function to parse GPT-4 response into structured format
function parseGptResponse(gptResponse) {
  try {
    return JSON.parse(gptResponse);
  } catch (error) {
    console.error("Error parsing GPT-4 response:", error.message);
    return {
      Education: { grade: "N/A", comment: "Failed to parse response" },
      ProfessionalExperience: {
        grade: "N/A",
        comment: "Failed to parse response",
      },
      PersonalStatement: { grade: "N/A", comment: "Failed to parse response" },
      LettersOfRecommendation: {
        grade: "N/A",
        comment: "Failed to parse response",
      },
    };
  }
}

// API route to grade multiple students with GPT-4
app.post("/api/grade-student", async (req, res) => {
  const { studentIds } = req.body;

  // Validate studentIds
  if (!studentIds || !Array.isArray(studentIds)) {
    return res.status(400).json({ message: "Invalid or missing studentIds." });
  }

  console.log("Student IDs received:", studentIds); // Logging student IDs for debugging

  const studentGrades = {}; // To store all students' grades

  try {
    // Use Promise.all to handle all students concurrently
    await Promise.all(
      studentIds.map(async (studentId) => {
        try {
          const studentDoc = await db
            .collection("students")
            .doc(studentId)
            .get();

          if (!studentDoc.exists) {
            studentGrades[studentId] = { error: "Student not found" };
            console.error(`Student not found: ID ${studentId}`);
            return;
          }

          const student = studentDoc.data();

          // Define the GPT-4 prompt with student's details
          const prompt = `
            You are reviewing a residency application.
            Please assess the following sections and return the feedback as JSON with "grade" and "comment" fields for each section:
            - Education: ${student.institution}, ${student.degree}
            - Professional Experience: ${student.impactful_experience_1_title}, ${student.impactful_experience_1_org}, ${student.impactful_experience_1_detail}
            - Personal Statement: ${student.personal_statement || "Not provided"}
            - Letters of Recommendation: ${student.letters || "Not provided"}

            Return your response in the following JSON format:
            {
              "Education": {
                "grade": "A",
                "comment": "Excellent academic background from Harvard."
              },
              "ProfessionalExperience": {
                "grade": "B+",
                "comment": "Good research experience but lacking in clinical exposure."
              },
              "PersonalStatement": {
                "grade": "C",
                "comment": "Vague and lacking personal experiences."
              },
              "LettersOfRecommendation": {
                "grade": "F",
                "comment": "No letters provided."
              }
            }
          `;

          const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "system", content: prompt }],
          });

          const gptResponse = response.choices[0].message.content;

          // Log the GPT-4 response for each student
          console.log(
            `GPT-4 response for student ID ${studentId}:`,
            gptResponse,
          );

          // Parse the response and store it in studentGrades
          studentGrades[studentId] = parseGptResponse(gptResponse);
        } catch (error) {
          console.error(
            "Error processing student ID:",
            studentId,
            error.message,
          );
          studentGrades[studentId] = {
            error: "Failed to process student data",
          };
        }
      }),
    );

    // Log the final result before sending the response
    console.log("Final student grades:", studentGrades);

    // Send all students' grades back after processing all of them
    res.status(200).json(studentGrades);
  } catch (error) {
    console.error("Error grading students:", error.message);
    res.status(500).json({
      message: "Error processing students with GPT-4.",
      error: error.message,
    });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
