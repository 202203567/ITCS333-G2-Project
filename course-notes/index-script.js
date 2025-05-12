// Global variables
let notes = [];
let currentPage = 1;
const notesPerPage = 3; // Number of notes per page
let filteredNotes = []; // Store filtered notes
const API_BASE_URL = '/api.php'; // Base URL for API endpoints

// Fetch notes from the API
async function fetchNotes() {
    const notesContainer = document.querySelector('.grid');
    notesContainer.innerHTML = '<p>Loading...</p>'; // Show loading state
    
    try {
        // Use the simplified API structure
        const response = await fetch(`${API_BASE_URL}?action=notes&page=${currentPage}&per_page=${notesPerPage}`);
        
        if (!response.ok) throw new Error('Failed to fetch notes');
        
        const data = await response.json(); // Parse JSON response
        notes = data.data; // Store notes in the global array
        filteredNotes = [...notes]; // Initialize filtered notes with all notes
        
        // Render notes
        renderNotes(notes);
        
        // Render pagination based on API pagination data
        renderPagination(data.pagination);
    } catch (error) {
        console.error('Error fetching notes:', error);
        notesContainer.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

// Fetch notes with filters
async function fetchFilteredNotes(params = {}) {
    const notesContainer = document.querySelector('.grid');
    notesContainer.innerHTML = '<p>Loading...</p>'; // Show loading state
    
    try {
        // Always include action=notes
        params.action = 'notes';
        
        // Build query string from params
        const queryString = Object.keys(params)
            .filter(key => params[key] !== undefined && params[key] !== '') // Skip empty params
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');
        
        const url = `${API_BASE_URL}?${queryString}`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error('Failed to fetch notes');
        
        const data = await response.json();
        notes = data.data;
        filteredNotes = [...notes];
        
        renderNotes(notes);
        renderPagination(data.pagination);
    } catch (error) {
        console.error('Error fetching filtered notes:', error);
        notesContainer.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

// Render notes
function renderNotes(notesToRender) {
    const notesContainer = document.querySelector('.grid');
    notesContainer.innerHTML = ''; // Clear loading state
    
    if (notesToRender.length === 0) {
        notesContainer.innerHTML = '<p>No notes found</p>';
        return;
    }
    
    notesToRender.forEach(note => {
        const noteElement = document.createElement('article');
        noteElement.innerHTML = `
            <h3>${note.title}</h3>
            <p>${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}</p>
            <footer>
                <small>${note.category} • Last updated: ${note.updated_at || note.created_at} • ${note.comment_count || 0} comments</small>
                <a href="details.html?id=${note.id}" role="button" class="outline">View</a>
            </footer>
        `;
        notesContainer.appendChild(noteElement);
    });
}

// Render pagination based on API pagination data
function renderPagination(pagination) {
    const paginationContainer = document.querySelector('nav ul');
    paginationContainer.innerHTML = '';
    
    if (!pagination) return;
    
    const totalPages = pagination.last_page;
    currentPage = pagination.current_page;
    
    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        const isCurrentPage = i === currentPage;
        pageItem.innerHTML = `<a href="#" data-page="${i}" ${isCurrentPage ? 'aria-current="page"' : ''}>${i}</a>`;
        paginationContainer.appendChild(pageItem);
    }
}

// Fetch categories for dropdown
async function fetchCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}?action=categories`);
        if (!response.ok) throw new Error('Failed to fetch categories');
        
        const data = await response.json();
        const categories = data.data;
        
        // Populate category dropdown
        const filterCategorySelect = document.querySelectorAll('.filters select')[0];
        
        // Then add categories from API
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            
            // Add to filter dropdown if it doesn't already have this option
            if (!Array.from(filterCategorySelect.options).some(opt => opt.value === category)) {
                filterCategorySelect.appendChild(option);
            }
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

// Search functionality
document.querySelector('input[type="search"]').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    // Reset to first page when searching
    currentPage = 1;
    
    // Use API for search instead of client-side filtering
    fetchFilteredNotes({
        search: searchTerm,
        page: currentPage,
        per_page: notesPerPage,
        category: document.querySelectorAll('.filters select')[0].value !== 'All Categories' 
            ? document.querySelectorAll('.filters select')[0].value 
            : '',
        sort: getSortValue(document.querySelectorAll('.filters select')[1].value)
    });
});

// Category filtering functionality
document.querySelectorAll('.filters select')[0].addEventListener('change', function(e) {
    const selectedCategory = e.target.value;
    
    // Reset to first page when filtering
    currentPage = 1;
    
    // Use API for filtering
    fetchFilteredNotes({
        category: selectedCategory !== 'All Categories' ? selectedCategory : '',
        page: currentPage,
        per_page: notesPerPage,
        search: document.querySelector('input[type="search"]').value,
        sort: getSortValue(document.querySelectorAll('.filters select')[1].value)
    });
});

// Sort functionality
document.querySelectorAll('.filters select')[1].addEventListener('change', function(e) {
    const sortValue = e.target.value;
    
    // Use API for sorting
    fetchFilteredNotes({
        sort: getSortValue(sortValue),
        page: currentPage,
        per_page: notesPerPage,
        search: document.querySelector('input[type="search"]').value,
        category: document.querySelectorAll('.filters select')[0].value !== 'All Categories' 
            ? document.querySelectorAll('.filters select')[0].value 
            : ''
    });
});

// Helper function to get sort value
function getSortValue(sortOption) {
    switch(sortOption) {
        case 'Sort by Title':
            return 'title';
        case 'Sort by Date (Newest First)':
            return 'date-desc'; // Newest first means descending order (newest at top)
        case 'Sort by Date (Oldest First)':
            return 'date-asc'; // Oldest first means ascending order (oldest at top)
        default:
            return 'date-desc'; // Default to newest first
    }
}

// Pagination click handler
document.querySelector('nav ul').addEventListener('click', function(e) {
    if (e.target.tagName === 'A' && e.target.dataset.page) {
        e.preventDefault();
        
        // Immediately scroll to top first, before any loading happens
        window.scrollTo(0, 0);
        
        // Then update page and fetch new data
        currentPage = parseInt(e.target.dataset.page);
        
        // Fetch notes for the selected page
        fetchFilteredNotes({
            page: currentPage,
            per_page: notesPerPage,
            search: document.querySelector('input[type="search"]').value,
            category: document.querySelectorAll('.filters select')[0].value !== 'All Categories' 
                ? document.querySelectorAll('.filters select')[0].value 
                : '',
            sort: getSortValue(document.querySelectorAll('.filters select')[1].value)
        });
    }
});

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    // Update the sort dropdown to include date options with clearer labels
    const sortDropdown = document.querySelectorAll('.filters select')[1];
    sortDropdown.innerHTML = `
        <option>Sort by Date (Newest First)</option>
        <option>Sort by Date (Oldest First)</option>
        <option>Sort by Title</option>
    `;
    
    fetchNotes();
    fetchCategories();
});
