// Global variables
let notes = [];
let currentPage = 1;
const notesPerPage = 5; // Number of notes per page
let filteredNotes = []; // Store filtered notes

async function fetchNotes() {
    const notesContainer = document.querySelector('.grid');
    notesContainer.innerHTML = '<p>Loading...</p>'; // Show loading state

    try {
        const response = await fetch('notes.json');
        if (!response.ok) throw new Error('Failed to fetch notes');
        notes = await response.json(); // Store notes in the global array
        filteredNotes = [...notes]; // Initialize filtered notes with all notes
        
        // Render notes with pagination
        renderNotes(paginateNotes(filteredNotes, currentPage));
        renderPagination();
    } catch (error) {
        console.error('Error fetching notes:', error);
        notesContainer.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

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
            <p>${note.body}</p>
            <footer>
                <small>${note.category} • Last updated: ${note.createdAt} • ${note.comments ? note.comments.length : 0} comments</small>
                <a href="#detail" role="button" class="outline" data-id="${note.id}">View</a>
            </footer>
        `;
        notesContainer.appendChild(noteElement);
    });
}

function paginateNotes(notesArray, page) {
    const start = (page - 1) * notesPerPage;
    return notesArray.slice(start, start + notesPerPage);
}

function renderPagination() {
    const totalPages = Math.ceil(filteredNotes.length / notesPerPage);
    const paginationContainer = document.querySelector('nav ul');
    paginationContainer.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        const isCurrentPage = i === currentPage;
        pageItem.innerHTML = `<a href="#" data-page="${i}" ${isCurrentPage ? 'aria-current="page"' : ''}>${i}</a>`;
        paginationContainer.appendChild(pageItem);
    }
}

// Search functionality
document.querySelector('input[type="search"]').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    // Reset to first page when searching
    currentPage = 1;
    
    if (searchTerm === '') {
        filteredNotes = [...notes]; // Reset to all notes
    } else {
        filteredNotes = notes.filter(note => 
            note.title.toLowerCase().includes(searchTerm) || 
            note.body.toLowerCase().includes(searchTerm)
        );
    }
    
    renderNotes(paginateNotes(filteredNotes, currentPage));
    renderPagination();
});

// Category filtering functionality
document.querySelectorAll('.filters select')[0].addEventListener('change', function(e) {
    const selectedCategory = e.target.value;
    
    // Reset to first page when filtering
    currentPage = 1;
    
    if (selectedCategory === 'All Categories') {
        filteredNotes = [...notes]; // Reset to all notes
    } else {
        // Map dropdown options to data categories
        let categoryToFilter;
        if (selectedCategory === 'Information Technology') {
            categoryToFilter = 'IT';
        } else if (selectedCategory === 'Mathematics') {
            categoryToFilter = 'Mathematics';
        } else {
            categoryToFilter = selectedCategory;
        }
        
        filteredNotes = notes.filter(note => note.category === categoryToFilter);
    }
    
    renderNotes(paginateNotes(filteredNotes, currentPage));
    renderPagination();
});

// Sort functionality
document.querySelectorAll('.filters select')[1].addEventListener('change', function(e) {
    const sortBy = e.target.value;
    
    if (sortBy === 'Sort by Title') {
        filteredNotes.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'Sort by Date') {
        filteredNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    renderNotes(paginateNotes(filteredNotes, currentPage));
});

// Form submit
document.querySelector('form').addEventListener('submit', function(e) {
    e.preventDefault();

    const title = document.getElementById('title').value.trim();
    const content = document.getElementById('content').value.trim();
    const category = document.getElementById('category').value;

    if (!title || !content || !category) {
        alert('All fields are required!');
        return;
    }

    // Create new note object
    const newNote = {
        id: notes.length + 1,
        title: title,
        body: content,
        category: category,
        createdAt: new Date().toISOString().split('T')[0],
        comments: [] // Initialize empty comments array
    };
    
    // Add to notes array
    notes.push(newNote);
    filteredNotes = [...notes];
    
    // Update display
    renderNotes(paginateNotes(filteredNotes, currentPage));
    renderPagination();
    
    alert('Note created successfully!');
    e.target.reset();
});

// Note detail view
document.querySelector('.grid').addEventListener('click', function(e) {
    if (e.target.tagName === 'A' && e.target.classList.contains('outline')) {
        const noteId = parseInt(e.target.dataset.id);
        const note = notes.find(n => n.id === noteId);
        
        if (note) {
            const detailSection = document.querySelector('#detail');
            detailSection.querySelector('h2').textContent = note.title;
            detailSection.querySelector('p:nth-of-type(1) strong').nextSibling.textContent = ` ${note.category}`;
            detailSection.querySelector('p:nth-of-type(2) strong').nextSibling.textContent = ` ${note.createdAt}`;
            detailSection.querySelector('.content').innerHTML = `<p>${note.body}</p>`;
            
            // Render comments
            renderComments(note);
            
            // Make sure to navigate to the detail section
            window.location.hash = 'detail';
        }
    }
});

// Render comments for a note
function renderComments(note) {
    const commentsSection = document.querySelector('.comments-section');
    const commentsContainer = document.createElement('div');
    
    // Update comments heading
    const commentsHeading = commentsSection.querySelector('h3');
    commentsHeading.textContent = `Comments (${note.comments ? note.comments.length : 0})`;
    
    // Clear existing comments (except the heading and form)
    const existingComments = commentsSection.querySelectorAll('.comment');
    existingComments.forEach(comment => comment.remove());
    
    // Add new comments
    if (note.comments && note.comments.length > 0) {
        note.comments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';
            commentElement.innerHTML = `
                <p>${comment.text}</p>
                <small>Posted by ${comment.author} • ${comment.date}</small>
            `;
            commentsSection.insertBefore(commentElement, commentsSection.querySelector('form'));
        });
    } else {
        const noCommentsElement = document.createElement('div');
        noCommentsElement.className = 'comment';
        noCommentsElement.innerHTML = `<p>No comments yet. Be the first to comment!</p>`;
        commentsSection.insertBefore(noCommentsElement, commentsSection.querySelector('form'));
    }
    
    // Set up comment form submission
    setupCommentForm(note);
}

// Set up comment form submission
function setupCommentForm(note) {
    const commentForm = document.querySelector('.comments-section form');
    
    // Remove any existing event listeners
    const newCommentForm = commentForm.cloneNode(true);
    commentForm.parentNode.replaceChild(newCommentForm, commentForm);
    
    // Add new event listener
    newCommentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const commentText = document.getElementById('comment').value.trim();
        if (!commentText) {
            alert('Please write a comment before posting.');
            return;
        }
        
        // Create new comment
        const newComment = {
            id: note.comments ? note.comments.length + 1 : 1,
            text: commentText,
            author: 'Anonymous User', // You could add a name field or use a stored username
            date: new Date().toISOString().split('T')[0]
        };
        
        // Add comment to note
        if (!note.comments) {
            note.comments = [];
        }
        note.comments.push(newComment);
        
        // Re-render comments
        renderComments(note);
        
        // Clear form
        e.target.reset();
        
        // Update note listing to show updated comment count
        renderNotes(paginateNotes(filteredNotes, currentPage));
    });
}

// Pagination click handler
document.querySelector('nav ul').addEventListener('click', function(e) {
    if (e.target.tagName === 'A' && e.target.dataset.page) {
        e.preventDefault();
        currentPage = parseInt(e.target.dataset.page);
        renderNotes(paginateNotes(filteredNotes, currentPage));
        renderPagination();
    }
});

// Call fetchNotes on page load
document.addEventListener('DOMContentLoaded', fetchNotes);
