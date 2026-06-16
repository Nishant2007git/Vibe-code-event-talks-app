// ==========================================
// STATE MANAGEMENT
// ==========================================
let allNotes = [];
let filteredNotes = [];
let searchQuery = "";
let selectedType = "all";
let sortAscending = false; // default: newest first
let activeTweetUpdate = null;

// ==========================================
// DOM ELEMENTS
// ==========================================
const notesGrid = document.getElementById("notes-grid");
const loadingSkeleton = document.getElementById("loading-skeleton");
const emptyState = document.getElementById("empty-state");
const searchInput = document.getElementById("search-input");
const typeFilters = document.getElementById("type-filters");
const sortBtn = document.getElementById("sort-btn");
const sortAscIcon = document.getElementById("sort-asc-icon");
const sortDescIcon = document.getElementById("sort-desc-icon");
const refreshBtn = document.getElementById("refresh-btn");
const resetFiltersBtn = document.getElementById("reset-filters-btn");

// Modal Elements
const tweetModal = document.getElementById("tweet-modal");
const closeModalBtn = document.getElementById("close-modal-btn");
const cancelTweetBtn = document.getElementById("cancel-tweet-btn");
const shareTweetBtn = document.getElementById("share-tweet-btn");
const tweetTextarea = document.getElementById("tweet-textarea");
const charCount = document.getElementById("char-count");
const hashtagBtns = document.querySelectorAll(".hashtag-btn");

// Preview Elements in Modal
const previewTag = document.getElementById("tweet-preview-tag");
const previewDate = document.getElementById("tweet-preview-date");
const previewDesc = document.getElementById("tweet-preview-desc");

// Stats Elements
const statTotal = document.getElementById("stat-total");
const statFeatures = document.getElementById("stat-features");
const statIssues = document.getElementById("stat-issues");
const statOthers = document.getElementById("stat-others");

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    fetchNotes(false);
    setupEventListeners();
});

// ==========================================
// EVENT LISTENERS
// ==========================================
function setupEventListeners() {
    // Refresh feed
    refreshBtn.addEventListener("click", () => {
        fetchNotes(true);
    });

    // Search input
    searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        filterAndRender();
    });

    // Type filter tabs
    typeFilters.addEventListener("click", (e) => {
        if (e.target.classList.contains("tab-btn")) {
            // Update active tab styling
            typeFilters.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
            e.target.classList.add("active");
            
            selectedType = e.target.dataset.type;
            filterAndRender();
        }
    });

    // Sort toggle
    sortBtn.addEventListener("click", () => {
        sortAscending = !sortAscending;
        
        // Toggle icons
        if (sortAscending) {
            sortAscIcon.classList.remove("hidden");
            sortDescIcon.classList.add("hidden");
            sortBtn.querySelector("span").textContent = "Oldest First";
        } else {
            sortAscIcon.classList.add("hidden");
            sortDescIcon.classList.remove("hidden");
            sortBtn.querySelector("span").textContent = "Newest First";
        }
        
        filterAndRender();
        showToast(`Sorted by date: ${sortAscending ? 'Oldest first' : 'Newest first'}`, 'info');
    });

    // Reset filters empty state button
    resetFiltersBtn.addEventListener("click", () => {
        searchInput.value = "";
        searchQuery = "";
        selectedType = "all";
        
        typeFilters.querySelectorAll(".tab-btn").forEach(btn => {
            if (btn.dataset.type === "all") btn.classList.add("active");
            else btn.classList.remove("active");
        });
        
        filterAndRender();
    });

    // Close Modal
    closeModalBtn.addEventListener("click", closeComposer);
    cancelTweetBtn.addEventListener("click", closeComposer);
    
    // Close modal on background click
    tweetModal.addEventListener("click", (e) => {
        if (e.target === tweetModal) closeComposer();
    });

    // Character counter logic
    tweetTextarea.addEventListener("input", updateCharCounter);

    // Hashtag Helpers
    hashtagBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            toggleHashtag(btn.dataset.tag, btn);
        });
    });

    // Tweet Share Action
    shareTweetBtn.addEventListener("click", publishTweet);
}

// ==========================================
// FEED FETCHING
// ==========================================
async function fetchNotes(forceRefresh = false) {
    toggleLoading(true);
    
    try {
        const url = `/api/notes${forceRefresh ? '?refresh=true' : ''}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === "error") {
            throw new Error(result.message);
        }
        
        allNotes = result.updates;
        
        if (result.status === "warning") {
            showToast(result.message, "error");
        } else {
            showToast(forceRefresh ? "Feed refreshed successfully!" : "Release notes loaded.", "success");
        }
        
        updateStats();
        filterAndRender();
        
    } catch (error) {
        console.error("Fetch failed:", error);
        showToast(`Failed to load release notes: ${error.message}`, "error");
        
        // Show empty state if no data
        if (allNotes.length === 0) {
            notesGrid.classList.add("hidden");
            emptyState.classList.remove("hidden");
        }
    } finally {
        toggleLoading(false);
    }
}

// ==========================================
// FILTER AND RENDER NOTES
// ==========================================
function filterAndRender() {
    // 1. Filter notes by category and search query
    filteredNotes = allNotes.filter(note => {
        const matchesType = (selectedType === "all") || (note.type === selectedType);
        
        const matchesSearch = !searchQuery || 
            note.date.toLowerCase().includes(searchQuery) ||
            note.type.toLowerCase().includes(searchQuery) ||
            note.plain_text.toLowerCase().includes(searchQuery);
            
        return matchesType && matchesSearch;
    });

    // 2. Sort notes by timestamp
    filteredNotes.sort((a, b) => {
        const dateA = new Date(a.timestamp || 0);
        const dateB = new Date(b.timestamp || 0);
        return sortAscending ? (dateA - dateB) : (dateB - dateA);
    });

    // 3. Render grid contents
    renderNotesGrid();
}

function renderNotesGrid() {
    // Check if empty
    if (filteredNotes.length === 0) {
        notesGrid.classList.add("hidden");
        emptyState.classList.remove("hidden");
        return;
    }

    emptyState.classList.add("hidden");
    notesGrid.classList.remove("hidden");
    notesGrid.innerHTML = "";

    filteredNotes.forEach(note => {
        const card = document.createElement("div");
        card.className = `note-card type-${note.type.toLowerCase()}`;
        
        // Parse category badge class
        let pillClass = "pill-update";
        if (note.type === "Feature") pillClass = "pill-feature";
        else if (note.type === "Issue") pillClass = "pill-issue";
        else if (note.type === "Deprecation") pillClass = "pill-deprecation";
        
        card.innerHTML = `
            <div>
                <div class="card-header">
                    <span class="category-pill ${pillClass}">${note.type}</span>
                    <span class="card-date">${note.date}</span>
                </div>
                <div class="card-body">
                    ${note.description}
                </div>
            </div>
            <div class="card-footer">
                <button class="btn btn-secondary btn-sm select-card-btn" title="Toggle selection highlight">
                    Select
                </button>
                <button class="btn btn-primary btn-sm tweet-btn">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    <span>Tweet</span>
                </button>
            </div>
        `;

        // Event listener for Highlight Selection
        const selectBtn = card.querySelector(".select-card-btn");
        selectBtn.addEventListener("click", () => {
            const isSelected = card.classList.toggle("selected-highlight");
            if (isSelected) {
                card.style.borderColor = "var(--accent-cyan)";
                card.style.boxShadow = "var(--shadow-glow)";
                selectBtn.textContent = "Selected";
                selectBtn.classList.remove("btn-secondary");
                selectBtn.classList.add("btn-primary");
                selectBtn.style.background = "var(--color-update)";
            } else {
                card.style.borderColor = "";
                card.style.boxShadow = "";
                selectBtn.textContent = "Select";
                selectBtn.classList.remove("btn-primary");
                selectBtn.classList.add("btn-secondary");
                selectBtn.style.background = "";
            }
        });

        // Event listener for Tweet Compose
        card.querySelector(".tweet-btn").addEventListener("click", () => {
            openComposer(note);
        });

        notesGrid.appendChild(card);
    });
}

// ==========================================
// STATS UPDATE
// ==========================================
function updateStats() {
    statTotal.textContent = allNotes.length;
    
    const featuresCount = allNotes.filter(n => n.type === "Feature").length;
    const issuesCount = allNotes.filter(n => n.type === "Issue").length;
    const othersCount = allNotes.length - featuresCount - issuesCount;
    
    statFeatures.textContent = featuresCount;
    statIssues.textContent = issuesCount;
    statOthers.textContent = othersCount;
}

// ==========================================
// TWEET MODAL & COMPOSER
// ==========================================
function openComposer(note) {
    activeTweetUpdate = note;
    
    // Set preview details
    previewTag.textContent = note.type;
    previewTag.className = `preview-tag pill-${note.type.toLowerCase()}`;
    previewDate.textContent = note.date;
    previewDesc.textContent = note.plain_text;
    
    // Reset hashtags active states
    hashtagBtns.forEach(btn => btn.classList.remove("active"));
    
    // Create initial tweet text
    // Example: BigQuery [Feature] (June 15, 2026): Use Gemini Cloud Assist to optimize query performance in BigQuery. https://docs.cloud.google.com/bigquery/docs/release-notes#June_15_2026
    const baseText = `BigQuery [${note.type}] (${note.date}): `;
    const linkText = `\n\nRead more: ${note.link}`;
    
    // Max description length (t.co links count as 23 characters on X, but we can compute relative length)
    // 280 - baseText - 23 (link) - 12 (margin/new lines)
    const urlLengthForX = 23;
    const reservedLength = baseText.length + urlLengthForX + 15;
    const maxDescLength = 280 - reservedLength;
    
    let descriptionText = note.plain_text;
    if (descriptionText.length > maxDescLength) {
        descriptionText = descriptionText.substring(0, maxDescLength - 3) + "...";
    }
    
    const initialTweet = `${baseText}${descriptionText}${linkText}`;
    tweetTextarea.value = initialTweet;
    
    updateCharCounter();
    
    // Show Modal
    tweetModal.classList.remove("hidden");
    setTimeout(() => {
        tweetModal.classList.add("active");
        tweetTextarea.focus();
    }, 50);
}

function closeComposer() {
    tweetModal.classList.remove("active");
    setTimeout(() => {
        tweetModal.classList.add("hidden");
        activeTweetUpdate = null;
    }, 300);
}

function updateCharCounter() {
    const text = tweetTextarea.value;
    
    // Estimate tweet length taking X's URL shortener (t.co) into account
    // URLs on X are shortened to 23 characters.
    let estimatedLength = text.length;
    
    if (activeTweetUpdate && activeTweetUpdate.link) {
        const linkPattern = new RegExp(escapeRegExp(activeTweetUpdate.link), 'g');
        if (linkPattern.test(text)) {
            // Replace the actual link size with 23 characters for the estimate
            estimatedLength = text.replace(linkPattern, "x".repeat(23)).length;
        }
    }
    
    charCount.textContent = estimatedLength;
    
    // Update counter color
    charCount.className = "";
    if (estimatedLength > 280) {
        charCount.classList.add("danger");
        shareTweetBtn.disabled = true;
        shareTweetBtn.style.opacity = 0.5;
        shareTweetBtn.style.cursor = "not-allowed";
    } else {
        shareTweetBtn.disabled = false;
        shareTweetBtn.style.opacity = 1;
        shareTweetBtn.style.cursor = "pointer";
        if (estimatedLength > 250) {
            charCount.classList.add("warning");
        }
    }
}

function toggleHashtag(tag, btnElement) {
    let text = tweetTextarea.value;
    const hasTag = text.includes(tag);
    
    if (hasTag) {
        // Remove tag
        // Match tag optionally followed by space or newline
        const regex = new RegExp(`\\s*${tag}\\s*`, 'g');
        text = text.replace(regex, ' ').trim();
        // Clean double spaces
        text = text.replace(/\s+/g, ' ');
        btnElement.classList.remove("active");
    } else {
        // Append tag before the link
        const linkMarker = `\n\nRead more:`;
        if (text.includes(linkMarker)) {
            const parts = text.split(linkMarker);
            parts[0] = parts[0].trim() + ` ${tag}`;
            text = parts.join(linkMarker);
        } else {
            text = text.trim() + ` ${tag}`;
        }
        btnElement.classList.add("active");
    }
    
    tweetTextarea.value = text;
    updateCharCounter();
}

function publishTweet() {
    const text = tweetTextarea.value;
    
    // Check limit
    let estimatedLength = text.length;
    if (activeTweetUpdate && activeTweetUpdate.link) {
        const linkPattern = new RegExp(escapeRegExp(activeTweetUpdate.link), 'g');
        if (linkPattern.test(text)) {
            estimatedLength = text.replace(linkPattern, "x".repeat(23)).length;
        }
    }
    
    if (estimatedLength > 280) {
        showToast("Tweet exceeds the 280-character limit!", "error");
        return;
    }
    
    // Launch Twitter/X Web Intent
    const xIntentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(xIntentUrl, "_blank", "width=600,height=400,resizable=yes");
    
    closeComposer();
    showToast("Opening X to publish your tweet!", "success");
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function toggleLoading(isLoading) {
    if (isLoading) {
        loadingSkeleton.classList.remove("hidden");
        notesGrid.classList.add("hidden");
        emptyState.classList.add("hidden");
        
        // Spinner toggle
        refreshBtn.querySelector(".refresh-icon").classList.add("hidden");
        refreshBtn.querySelector(".spinner-icon").classList.remove("hidden");
        refreshBtn.disabled = true;
    } else {
        loadingSkeleton.classList.add("hidden");
        
        refreshBtn.querySelector(".refresh-icon").classList.remove("hidden");
        refreshBtn.querySelector(".spinner-icon").classList.add("hidden");
        refreshBtn.disabled = false;
    }
}

function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    let icon = "";
    if (type === "success") {
        icon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
    } else if (type === "error") {
        icon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
    } else {
        icon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
    }
    
    toast.innerHTML = `
        ${icon}
        <span class="toast-message">${message}</span>
        <button class="toast-close">&times;</button>
    `;
    
    // Close button event
    toast.querySelector(".toast-close").addEventListener("click", () => {
        toast.style.animation = "none";
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    });
    
    container.appendChild(toast);
    
    // Auto-remove toast
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.opacity = "0";
            toast.style.transition = "opacity 0.3s ease";
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
