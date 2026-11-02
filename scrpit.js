
const defaultSubjects = [
    { id: "chemistry", name: "Chemistry", icon: "🧪" },
    { id: "mathematics", name: "Mathematics", icon: "📐" },
    { id: "physics", name: "Physics", icon: "⚛️" },
    { id: "computer", name: "Computer", icon: "💻" },
    { id: "urdu", name: "Urdu", icon: "📜" },
    { id: "english", name: "English", icon: "📖" },
    { id: "islamiat", name: "Islamiat", icon: "☪️" },
    { id: "history", name: "History", icon: "🏛️" },
    { id: "geography", name: "Geography", icon: "🌍" }
];

const categories = {
    notes: "Chapter Notes",
    questions: "Questions & Answers",
    definitions: "Important Definitions",
    revision: "Revision Points"
};

let subjects = loadData();

let currentSubject = null;
let currentChapter = null;
let currentTab = "notes";

// LOAD AND SAVE DATA

function loadData() {
    try {
        const saved = localStorage.getItem("studyVaultData");
        if (saved) {
            const data = JSON.parse(saved);
            if (Array.isArray(data) && data.length === 9) {
                return data;
            }
        }
    } catch (error) {
        console.error("Could not load saved data:", error);
    }

    return defaultSubjects.map(subject => ({
        ...subject,
        chapters: []
    }));
}

function saveData() {
    try {
        localStorage.setItem("studyVaultData", JSON.stringify(subjects));
    } catch (error) {
        alert("Unable to save. Your browser storage may be full.");
    }
}

// HELPER

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function getSubject(id) {
    return subjects.find(s => s.id === id);
}

function getChapter() {
    const subject = getSubject(currentSubject);
    return subject?.chapters.find(c => c.id === currentChapter);
}

// SIDEBAR AND DASHBOARD

function renderSubjects() {
    const list = document.getElementById("subjectList");
    const grid = document.getElementById("subjectGrid");

    list.innerHTML = subjects.map(s => `
        <button class="subject-btn ${currentSubject === s.id ? "active" : ""}"
            onclick="openSubject('${s.id}')">
            ${s.icon} ${escapeHTML(s.name)}
        </button>
    `).join("");

    grid.innerHTML = subjects.map(s => `
        <div class="subject-card" onclick="openSubject('${s.id}')">
            <div class="subject-icon">${s.icon}</div>
            <h3>${escapeHTML(s.name)}</h3>
            <p>${s.chapters.length} Chapters →</p>
        </div>
    `).join("");

    updateStats();
}

function updateStats() {
    const total = subjects.reduce(
        (sum, s) => sum + s.chapters.length, 0
    );

    const completed = subjects.reduce(
        (sum, s) => sum + s.chapters.filter(c => c.completed).length, 0
    );

    document.getElementById("totalSubjects").textContent = subjects.length;
    document.getElementById("totalChapters").textContent = total;
    document.getElementById("completedChapters").textContent = completed;
}

// PAGE NAVIGATION

function showPage(page) {
    ["dashboard", "subjectPage", "chapterPage", "searchPage"]
        .forEach(id => {
            document.getElementById(id).classList.add("hidden");
        });

    document.getElementById(page).classList.remove("hidden");
}

function showDashboard() {
    currentSubject = null;
    currentChapter = null;

    showPage("dashboard");
    document.getElementById("pageTitle").textContent = "Dashboard";

    document.getElementById("homeBtn").classList.add("active");

    renderSubjects();
}

function openSubject(id) {
    currentSubject = id;
    currentChapter = null;

    const subject = getSubject(id);
    if (!subject) return;

    showPage("subjectPage");

    document.getElementById("pageTitle").textContent = subject.name;
    document.getElementById("subjectHeading").textContent =
        subject.icon + " " + subject.name;

    document.getElementById("chapterCount").textContent =
        `${subject.chapters.length} chapters in this subject`;

    document.getElementById("homeBtn").classList.remove("active");

    renderSubjects();
    renderChapters();
}

// CHAPTER MANAGEMENT

function addChapter() {
    const subject = getSubject(currentSubject);
    if (!subject) return;

    const name = prompt("Enter chapter name:");

    if (!name || !name.trim()) return;

    const chapter = {
        id: Date.now().toString(),
        name: name.trim(),
        completed: false,
        content: {
            notes: "",
            questions: "",
            definitions: "",
            revision: ""
        }
    };

    subject.chapters.push(chapter);

    saveData();
    renderChapters();
    renderSubjects();
}

function renderChapters() {
    const subject = getSubject(currentSubject);
    const list = document.getElementById("chapterList");

    document.getElementById("chapterCount").textContent =
        `${subject.chapters.length} chapters in this subject`;

    if (subject.chapters.length === 0) {
        list.innerHTML = `
            <div class="empty">
                <h3>No chapters yet!</h3>
                <p>Click + Add Chapter to create your first chapter.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = subject.chapters.map((chapter, index) => `
        <div class="chapter-card"
            onclick="openChapter('${chapter.id}')">

            <div>
                <h3>Chapter ${index + 1}: ${escapeHTML(chapter.name)}</h3>
                <p>${chapter.completed ? "Completed" : "Not completed"} · Click to open</p>
            </div>

            <span class="chapter-check">
                ${chapter.completed ? "✓" : "→"}
            </span>
        </div>
    `).join("");
}

// OPEN CHAPTER

function openChapter(id) {
    currentChapter = id;

    const chapter = getChapter();
    const subject = getSubject(currentSubject);

    if (!chapter || !subject) return;

    showPage("chapterPage");

    document.getElementById("pageTitle").textContent = chapter.name;
    document.getElementById("chapterSubject").textContent = subject.name;
    document.getElementById("chapterHeading").textContent = chapter.name;

    renderTabs();
    loadEditor();

    updateCompleteButton();
}

// CONTENT TABS

function renderTabs() {
    document.querySelectorAll(".tab").forEach(tab => {
        tab.classList.toggle(
            "active",
            tab.dataset.tab === currentTab
        );

        tab.onclick = () => switchTab(tab.dataset.tab);
    });
}

function switchTab(tab) {
    saveContent();

    currentTab = tab;

    renderTabs();
    loadEditor();
}

function loadEditor() {
    const chapter = getChapter();
    if (!chapter) return;

    document.getElementById("editorTitle").textContent =
        categories[currentTab];

    document.getElementById("contentEditor").value =
        chapter.content[currentTab] || "";

    document.getElementById("saveStatus").textContent = "Saved locally";
}

// SAVE CONTENT

function saveContent() {
    const chapter = getChapter();
    if (!chapter) return;

    chapter.content[currentTab] =
        document.getElementById("contentEditor").value;

    saveData();

    document.getElementById("saveStatus").textContent = "✓ Saved!";
}

// COMPLETE CHAPTER

function toggleComplete() {
    const chapter = getChapter();
    if (!chapter) return;

    chapter.completed = !chapter.completed;

    saveData();
    updateCompleteButton();
    renderChapters();
    renderSubjects();
}

function updateCompleteButton() {
    const chapter = getChapter();
    const button = document.getElementById("completeBtn");

    button.textContent = chapter.completed
        ? "✓ Completed"
        : "✓ Mark Complete";

    button.classList.toggle("done", chapter.completed);
}

// DELETE CHAPTER

function deleteChapter() {
    const subject = getSubject(currentSubject);
    if (!subject) return;

    if (!confirm("Are you sure you want to delete this chapter and all its content?")) {
        return;
    }

    subject.chapters = subject.chapters.filter(
        c => c.id !== currentChapter
    );

    currentChapter = null;

    saveData();
    renderSubjects();
    openSubject(currentSubject);
}

// SEARCH NOTES AND CHAPTERS

function searchNotes() {
    const query = document.getElementById("searchInput")
        .value.trim().toLowerCase();

    if (!query) {
        if (currentChapter) {
            showPage("chapterPage");
        } else if (currentSubject) {
            showPage("subjectPage");
        } else {
            showPage("dashboard");
        }
        return;
    }

    showPage("searchPage");

    document.getElementById("pageTitle").textContent = "Search";

    const results = [];

    subjects.forEach(subject => {
        subject.chapters.forEach(chapter => {
            const chapterMatch = chapter.name.toLowerCase().includes(query);

            Object.entries(chapter.content).forEach(([key, value]) => {
                if (
                    value.toLowerCase().includes(query) ||
                    chapterMatch
                ) {
                    if (!results.some(r =>
                        r.subject.id === subject.id &&
                        r.chapter.id === chapter.id &&
                        r.category === key
                    )) {
                        results.push({
                            subject,
                            chapter,
                            category: key
                        });
                    }
                }
            });
        });
    });

    const container = document.getElementById("searchResults");

    if (results.length === 0) {
        container.innerHTML = `
            <div class="empty">No matching notes or chapters found.</div>
        `;
        return;
    }

    container.innerHTML = results.map(r => `
        <div class="result-card"
            onclick="openSearchResult('${r.subject.id}','${r.chapter.id}','${r.category}')">

            <h3>${r.subject.icon} ${escapeHTML(r.subject.name)} /
                ${escapeHTML(r.chapter.name)}</h3>

            <p>${categories[r.category]}</p>
        </div>
    `).join("");
}

function openSearchResult(subjectId, chapterId, category) {
    currentSubject = subjectId;
    currentChapter = chapterId;
    currentTab = category;

    document.getElementById("searchInput").value = "";

    renderSubjects();
    openChapter(chapterId);
}

// DARK AND LIGHT MODE

function toggleTheme() {
    document.body.classList.toggle("light");

    localStorage.setItem(
        "studyVaultTheme",
        document.body.classList.contains("light") ? "light" : "dark"
    );
}

if (localStorage.getItem("studyVaultTheme") === "light") {
    document.body.classList.add("light");
}

// START APP

showDashboard();
