const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./projects.db", (error) => {
    if (error) {
        console.error("Database connection failed:", error.message);
    } else {
        console.log("Database connected successfully!");
    }
});

db.run(`
    CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        studentName TEXT NOT NULL,
        description TEXT NOT NULL,
        githubLink TEXT,
        livePreview TEXT,
        tags TEXT,
        status TEXT DEFAULT 'pending'
    )
`, (error) => {
    if (error) {
        console.error("Table creation failed:", error.message);
    } else {
        console.log("Projects table created successfully!");
    }
});

module.exports = db;