const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai"); // Import the correct OpenAI class from the SDK
require("dotenv").config(); // For environment variables (API key)
const db = require("./db"); // Import your SQLite database setup

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// OpenAI Configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Securely load API key from environment variables
  organization: process.env.OPENAI_ORGANIZATION_ID, // Optional: For org-scoped API keys
  project: process.env.OPENAI_PROJECT_ID, // Optional: If using project-scoped API keys
});

// API route to fetch all student submissions (from SQLite)
app.get("/fetch-students", (req, res) => {
  db.all("SELECT * FROM students", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(rows);
  });
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
app.post("/grade-student", async (req, res) => {
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
      studentIds.map(
        (studentId) =>
          new Promise((resolve, reject) => {
            console.log(`Processing student ID: ${studentId}`); // Log each student ID being processed

            db.get(
              "SELECT * FROM students WHERE id = ?",
              [studentId],
              async (err, student) => {
                if (err) {
                  studentGrades[studentId] = { error: err.message };
                  console.error(
                    `DB error for student ID ${studentId}:`,
                    err.message,
                  );
                  return resolve(); // Ensure the promise resolves even if there's an error
                }

                if (!student) {
                  studentGrades[studentId] = { error: "Student not found" };
                  console.error(`Student not found: ID ${studentId}`);
                  return resolve(); // Resolve even if student is not found
                }

                // Define the GPT-4 prompt with student's details
                const prompt = `
                  You are reviewing a residency application.
                  Please assess the following sections and return the feedback as JSON with "grade" and "comment" fields for each section:
                  - Education: ${student.institution}, ${student.degree}
                  - Professional Experience: ${student.impactful_experience_1_title}, ${student.impactful_experience_1_org}
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

                try {
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
                  resolve(); // Successfully graded this student
                } catch (gptError) {
                  console.error("Error calling GPT-4 API:", gptError.message);
                  studentGrades[studentId] = {
                    error: "Failed to process student data with GPT-4",
                  };
                  resolve(); // Continue even on failure to call GPT-4
                }
              },
            );
          }),
      ),
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
