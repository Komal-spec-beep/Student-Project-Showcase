
const projectForm = document.getElementById("projectForm");
const projectTitle = document.getElementById("projectTitle");
const studentName = document.getElementById("studentName");
const projectDescription = document.getElementById("projectDescription");
const githubLink = document.getElementById("githubLink");
const livePreview = document.getElementById("livePreview");
const projectTags = document.getElementById("projectTags");

const searchInput = document.getElementById("searchInput");
const projectsContainer = document.getElementById("projectsContainer");
const paginationContainer = document.getElementById("paginationContainer");

const prevProject = document.getElementById("prevProject");
const nextProject = document.getElementById("nextProject");
const carouselWrapper = document.querySelector(".carousel-wrapper");

let currentPage = 1;
let totalPages = 1;
let currentSearch = "";

let autoSlideTimer = null;
let requestController = null;


// --------------------------------
// Submit New Project
// --------------------------------

if (projectForm) {
    projectForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const project = {
            title: projectTitle.value.trim(),
            studentName: studentName.value.trim(),
            description: projectDescription.value.trim(),
            githubLink: githubLink.value.trim(),
            livePreview: livePreview.value.trim(),
            tags: projectTags.value.trim()
        };

        if (!project.title || !project.studentName || !project.description) {
            alert("Please fill in all required fields.");
            return;
        }

        try {
            const response = await fetch("/api/projects", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(project)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Project submission failed.");
            }

            alert(data.message || "Project submitted successfully!");

            projectForm.reset();

            if (searchInput) {
                searchInput.value = "";
            }

            currentSearch = "";
            loadProjects(1, "");

        } catch (error) {
            console.error("Submission error:", error);
            alert(error.message || "Something went wrong!");
        }
    });
}


// --------------------------------
// Load Projects from Database
// --------------------------------

async function loadProjects(page = 1, search = currentSearch) {

    if (!projectsContainer) return;

    currentSearch = search;

    clearInterval(autoSlideTimer);

    if (requestController) {
        requestController.abort();
    }

    requestController = new AbortController();

    projectsContainer.innerHTML = "<p>Loading projects...</p>";

    try {
        const response = await fetch(
            `/api/projects?page=${page}&search=${encodeURIComponent(currentSearch)}`,
            { signal: requestController.signal }
        );

        if (!response.ok) {
            throw new Error("Failed to load projects.");
        }

        const data = await response.json();

        currentPage = data.currentPage;
        totalPages = data.totalPages;

        displayProjects(data.projects);
        displayPagination();

        startAutoSlide();

    } catch (error) {

        if (error.name === "AbortError") return;

        console.error("Project loading error:", error);

        projectsContainer.innerHTML =
            "<p>Unable to load projects. Please try again.</p>";
    }
}


// --------------------------------
// Display One Project
// --------------------------------

function displayProjects(projects) {

    projectsContainer.innerHTML = "";

    if (!projects || projects.length === 0) {
        projectsContainer.innerHTML =
            "<p>No matching projects found.</p>";
        return;
    }

    const project = projects[0];

    const projectCard = document.createElement("div");
    projectCard.classList.add("project-card");

    projectCard.innerHTML = `
        <h3>${escapeHTML(project.title)}</h3>

        <p><strong>Student:</strong>
            ${escapeHTML(project.studentName)}
        </p>

        <p>${escapeHTML(project.description)}</p>

        <p><strong>Tags:</strong>
            ${escapeHTML(project.tags || "No tags")}
        </p>
    `;

    projectsContainer.appendChild(projectCard);
}


// --------------------------------
// Safe HTML Text
// --------------------------------

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}


// --------------------------------
// Display Only 5 Carousel Dots
// --------------------------------

function displayPagination() {

    if (!paginationContainer) return;

    paginationContainer.innerHTML = "";

    if (totalPages <= 1) return;

    const visibleDots = 5;

    let startPage = Math.max(1, currentPage - 2);

    let endPage = Math.min(
        totalPages,
        startPage + visibleDots - 1
    );

    if (endPage - startPage < visibleDots - 1) {
        startPage = Math.max(
            1,
            endPage - visibleDots + 1
        );
    }

    for (let i = startPage; i <= endPage; i++) {

        const dot = document.createElement("button");

        dot.classList.add("carousel-dot");

        if (i === currentPage) {
            dot.classList.add("active");
        }

        dot.setAttribute("aria-label", `Project ${i}`);

        dot.addEventListener("click", () => {
            loadProjects(i, currentSearch);
        });

        paginationContainer.appendChild(dot);
    }
}


// --------------------------------
// Next Project
// --------------------------------

function nextSlide() {

    if (totalPages <= 1) return;

    const nextPage =
        currentPage >= totalPages ? 1 : currentPage + 1;

    loadProjects(nextPage, currentSearch);
}


// --------------------------------
// Previous Project
// --------------------------------

function prevSlide() {

    if (totalPages <= 1) return;

    const previousPage =
        currentPage <= 1 ? totalPages : currentPage - 1;

    loadProjects(previousPage, currentSearch);
}


// --------------------------------
// Navigation Buttons
// --------------------------------

if (nextProject) {
    nextProject.addEventListener("click", nextSlide);
}

if (prevProject) {
    prevProject.addEventListener("click", prevSlide);
}


// --------------------------------
// Automatic Sliding
// --------------------------------

function startAutoSlide() {

    clearInterval(autoSlideTimer);

    if (totalPages <= 1) return;

    autoSlideTimer = setInterval(() => {
        nextSlide();
    }, 5000);
}


// --------------------------------
// Pause on Hover / Keyboard Focus
// --------------------------------

if (carouselWrapper) {

    carouselWrapper.addEventListener("mouseenter", () => {
        clearInterval(autoSlideTimer);
    });

    carouselWrapper.addEventListener("mouseleave", startAutoSlide);

    carouselWrapper.addEventListener("focusin", () => {
        clearInterval(autoSlideTimer);
    });

    carouselWrapper.addEventListener("focusout", startAutoSlide);
}


// --------------------------------
// Search Projects
// --------------------------------

if (searchInput) {

    let searchTimeout;

    searchInput.addEventListener("input", () => {

        clearTimeout(searchTimeout);

        searchTimeout = setTimeout(() => {

            loadProjects(1, searchInput.value.trim());

        }, 300);
    });
}


// --------------------------------
// Initial Project Load
// --------------------------------

loadProjects(1, "");

console.log("Student Project Showcase is ready!");
