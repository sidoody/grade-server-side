const sqlite3 = require("sqlite3").verbose();

// Open a database connection
let db = new sqlite3.Database(":memory:", (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Connected to the in-memory SQLite database.");
});

// Create the students table with new fields for personal statement and letter of recommendation
db.serialize(() => {
  db.run(`
    CREATE TABLE students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT,
      last_name TEXT,
      gender TEXT,
      email TEXT,
      birth_date TEXT,
      nrmp_match_id TEXT,
      geographical_pref_1 TEXT,
      geographical_pref_2 TEXT,
      geographical_pref_3 TEXT,
      setting_pref TEXT,
      institution TEXT,
      degree TEXT,
      aoa TEXT,
      gold_humanism TEXT,
      other_honors TEXT,
      impactful_experience_1_title TEXT,
      impactful_experience_1_org TEXT,
      impactful_experience_1_type TEXT,
      impactful_experience_1_desc TEXT,
      impactful_experience_2_title TEXT,
      impactful_experience_2_org TEXT,
      impactful_experience_2_type TEXT,
      impactful_experience_2_desc TEXT,
      impactful_experience_3_title TEXT,
      impactful_experience_3_org TEXT,
      impactful_experience_3_type TEXT,
      impactful_experience_3_desc TEXT,
      step_2_ck_score INTEGER,
      personal_statement TEXT,
      letter_of_recommendation TEXT
    )
  `);

  // Insert dummy data for 5 students with personal statement and letter of recommendation
  db.run(`
    INSERT INTO students (
      first_name, last_name, gender, email, birth_date, nrmp_match_id, geographical_pref_1, geographical_pref_2, geographical_pref_3, setting_pref,
      institution, degree, aoa, gold_humanism, other_honors,
      impactful_experience_1_title, impactful_experience_1_org, impactful_experience_1_type, impactful_experience_1_desc,
      impactful_experience_2_title, impactful_experience_2_org, impactful_experience_2_type, impactful_experience_2_desc,
      impactful_experience_3_title, impactful_experience_3_org, impactful_experience_3_type, impactful_experience_3_desc,
      step_2_ck_score, personal_statement, letter_of_recommendation
    ) VALUES
    ('John', 'Doe', 'Male', 'john.doe@example.com', '1990-01-01', '123456', 'Northeast', 'Southeast', NULL, 'Urban',
     'Harvard Medical School', 'MD', 'Yes', 'No', 'Cum Laude',
     'Research Fellow', 'XYZ University', 'Research', 'Led a groundbreaking research on cancer.',
     NULL, NULL, NULL, NULL,
     NULL, NULL, NULL, NULL, 250, 
     'I am passionate about medicine and research...', 
     'John is a remarkable candidate...'),

    ('Jane', 'Smith', 'Female', 'jane.smith@example.com', '1992-04-12', '654321', 'Midwest', 'West Coast', NULL, 'Suburban',
     'Stanford University', 'MD', 'No', 'Yes', 'Dean''s List',        -- Escaped apostrophe here
     'Volunteer', 'ABC Charity', 'Volunteer', 'Provided healthcare to underserved populations.',
     'Medical Officer', 'World Health Org', 'Work', 'Managed healthcare initiatives in rural regions.',
     NULL, NULL, NULL, NULL, 260,
     'My goal is to bridge the gap between clinical care and global health...',
     'Jane is an excellent student with a drive for global health...'),

    ('Alice', 'Johnson', 'Female', 'alice.johnson@example.com', '1991-06-15', '789101', 'No preference', NULL, NULL, 'Rural',
     'Yale University', 'MD', 'No', 'No', 'Graduated with Distinction',
     'President', 'Student Medical Association', 'Professional Org', 'Led the medical student organization for 2 years.',
     'Resident Physician', 'XYZ Hospital', 'Work', 'Worked in the internal medicine department as a resident.',
     'Volunteer', 'Global Health Outreach', 'Volunteer', 'Participated in medical missions abroad.', 240,
     'My passion for rural health drives my ambition to become a leader in healthcare...',
     'Alice has been a consistent and driven individual, demonstrating exceptional leadership...'),

    ('Michael', 'Brown', 'Male', 'michael.brown@example.com', '1993-11-20', '246810', 'South', 'No preference', NULL, 'No preference',
     'University of Texas', 'DO', 'Yes', 'No', 'Magna Cum Laude',
     'Volunteer Coordinator', 'Local Community Center', 'Volunteer', 'Coordinated community health outreach programs.',
     NULL, NULL, NULL, NULL,
     NULL, NULL, NULL, NULL, 255,
     'My experience in community health has shaped my desire to pursue family medicine...',
     'Michael has a keen sense of responsibility and dedication to community healthcare...'),

    ('Emily', 'Davis', 'Female', 'emily.davis@example.com', '1994-02-22', '135791', 'West Coast', 'Midwest', NULL, 'Urban',
     'University of California', 'MD', 'No', 'No', 'Graduated Summa Cum Laude',
     'Clinical Researcher', 'XYZ Hospital', 'Research', 'Conducted clinical trials on cardiovascular health.',
     'Teaching Assistant', 'Medical School', 'Teaching', 'Taught anatomy to first-year medical students.',
     NULL, NULL, NULL, NULL, 265,
     'As a clinical researcher, I aim to advance cardiovascular health...',
     'Emily''s dedication to cardiovascular research is unparalleled...')     -- Escaped apostrophe here
  `);
});

module.exports = db;
