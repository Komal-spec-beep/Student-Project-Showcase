const express = require("express");
const db = require("./database");

const app = express();
app.use(express.json({ limit: "100kb" }));
app.use(express.static("../public"));

app.get("/", (req, res) => {
    res.sendFile("index.html", {root: "../public"});
});


app.post("/api/projects", (req, res) => {
    const {
        title,
        studentName,
        description,
        githubLink,
        livePreview,
        tags
    } = req.body;

    if (
    typeof title !== "string" ||
    typeof studentName !== "string" ||
    typeof description !== "string" ||
    !title.trim() ||
    !studentName.trim() ||
    !description.trim()
) {
    return res.status(400).json({
        message: "Title, student name and description are required."
    });
}

    const sql = `
        INSERT INTO projects
        (title, studentName, description, githubLink, livePreview, tags)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
       [
    title.trim(),
    studentName.trim(),
    description.trim(),
    typeof githubLink === "string" ? githubLink.trim() : "",
    typeof livePreview === "string" ? livePreview.trim() : "",
    typeof tags === "string" ? tags.trim() : ""
],
        function(error) {
            if (error) {
                console.error("Project save failed:", error.message);
                return res.status(500).json({
                    message: "Failed to save project."
                });
            }

            res.status(201).json({
                message: "Project saved successfully!",
                projectId: this.lastID
            });
        }
    );
});

app.get("/api/projects", (req, res) => {
    // Get the requested project position
    const page = Math.max(1, parseInt(req.query.page) || 1);

    // Get the search text
    const search = (req.query.search || "").trim();

    // Fetch one project at a time
    const limit = 1;
    const offset = (page - 1) * limit;

    // Search across all projects
    const searchCondition = `
        WHERE title LIKE ?
        OR studentName LIKE ?
        OR description LIKE ?
        OR tags LIKE ?
    `;

    const searchValue = `%${search}%`;

    const countSql = search
        ? `SELECT COUNT(*) AS total FROM projects ${searchCondition}`
        : "SELECT COUNT(*) AS total FROM projects";

    const projectSql = search
        ? `SELECT * FROM projects ${searchCondition}
           ORDER BY id DESC LIMIT ? OFFSET ?`
        : "SELECT * FROM projects ORDER BY id DESC LIMIT ? OFFSET ?";

    const countParams = search
        ? [searchValue, searchValue, searchValue, searchValue]
        : [];

    db.get(countSql, countParams, (error, result) => {
        if (error) {
            console.error("Project count failed:", error.message);
            return res.status(500).json({
                message: "Failed to count projects."
            });
        }

        const totalProjects = result.total;
        const totalPages = Math.ceil(totalProjects / limit);

        const projectParams = search
            ? [...countParams, limit, offset]
            : [limit, offset];

        db.all(projectSql, projectParams, (error, rows) => {
            if (error) {
                console.error("Projects fetch failed:", error.message);
                return res.status(500).json({
                    message: "Failed to fetch projects."
                });
            }

            res.json({
                projects: rows,
                totalProjects,
                totalPages,
                currentPage: page
            });
        });
    });
});

app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});