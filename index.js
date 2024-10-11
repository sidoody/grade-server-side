const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { OpenAI } = require("openai"); // Import the correct OpenAI class from the SDK
require("dotenv").config(); // For environment variables (API key)
const pdfParse = require("pdf-parse"); // To handle PDF text extraction

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer setup for file uploads (handling PDF files)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// OpenAI Configuration with project-scoped keys (if applicable)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Securely load API key from environment variables
  organization: process.env.OPENAI_ORGANIZATION_ID, // Optional: For org-scoped API keys
  project: process.env.OPENAI_PROJECT_ID, // Optional: If using project-scoped API keys
});

// API route to handle CV uploads (PDF only)
app.post("/grade-cv", upload.single("file"), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  try {
    // Extract text from the uploaded PDF file
    const pdfData = await pdfParse(file.buffer);
    const cvContent = pdfData.text; // Extracted text from the PDF

    if (!cvContent || cvContent.trim() === "") {
      throw new Error(
        "Could not extract text from the PDF. Please make sure the file contains readable text.",
      );
    }

    // Updated prompt to return HTML-like response
    const prompt = `
    You are reviewing a CV for a medical residency program. 
    Please assess the following sections:
    - Education
    - Professional Experience
    - Teaching Experience
    - Professional Activities

    For each section, provide a detailed review and a grade (A, B+, etc.).

    Return the response formatted in HTML as follows:

    <h3>Education</h3>
    <h4>Grade</h4>
    <p>Education review</p>

    <h3>Professional Experience</h3>
    <h4>Grade</h4>
    <p>Professional experience review</p>

    <h3>Teaching Experience</h3>
    <h4>Grade</h4>
    <p>Teaching experience review</p>

    <h3>Professional Activities</h3>
    <h4>Grade</h4>
    <p>Professional activities review</p>
    `;

    // Send the CV content and prompt to GPT-4 for grading
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: `Here is the CV content: ${cvContent}` },
      ],
    });

    // Log the raw GPT-4 response for debugging
    const gptResponse = response.choices[0].message.content;
    console.log("Raw GPT-4 Response:", gptResponse);

    // Send the raw HTML-like response back to the client
    res.status(200).json({ content: gptResponse });
  } catch (error) {
    console.error("Error calling GPT-4 API:", error.message);
    res.status(500).json({
      message: "Error processing CV with GPT-4.",
      error: error.message,
    });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
