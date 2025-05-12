// Global variables
const API_BASE_URL = '/api.php'; // Base URL for API endpoints
let currentNoteId = null;

// Helper function to get URL parameters
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Fetch note details
async function fetchNoteDetails() {
    // Get the note ID from URL
    const noteId = getUrlParameter('id');
    
    if (!noteId) {
        alert('No note ID provided');
        window.location.href = 'index.html';
        return;
    }
    
    currentNoteId = noteId;
    
    try {
        // Fetch specific note with details using query parameters
        const response = await fetch(`${API_BASE_URL}?action=notes&id=${noteId}`);
        if (!response.ok) throw new Error('Failed to fetch note details');
        
        const data = await response.json();
        const note = data.data;
        
        if (note) {
            document.title = `${note.title} - ITCS333 Project`;
            
            const detailSection = document.querySelector('#detail');
            detailSection.querySelector('h2').textContent = note.title;
            detailSection.querySelector('p:nth-of-type(1) strong').nextSibling.textContent = ` ${note.category}`;
            detailSection.querySelector('p:nth-of-type(2) strong').nextSibling.textContent = ` ${note.created_at}`;
            detailSection.querySelector('.content').innerHTML = `<p>${note.content}</p>`;
            
            // Get comments for this note
            fetchComments(note.id);
            
            // Set up edit and delete buttons
            setupNoteActions(note);
        } else {
            alert('Note not found');
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Error fetching note details:', error);
        alert(`Error: ${error.message}`);
        window.location.href = 'index.html';
    }
}

// Fetch comments for a note
async function fetchComments(noteId) {
    try {
        const response = await fetch(`${API_BASE_URL}?action=comments&note_id=${noteId}`);
        if (!response.ok) throw new Error('Failed to fetch comments');
        
        const data = await response.json();
        const comments = data.data;
        
        renderComments(noteId, comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
    }
}

// Render comments for a note
function renderComments(noteId, comments = []) {
    const commentsSection = document.querySelector('.comments-section');
    
    // Update comments heading
    const commentsHeading = commentsSection.querySelector('h3');
    commentsHeading.textContent = `Comments (${comments.length})`;
    
    // Clear existing comments (except the heading and form)
    const existingComments = commentsSection.querySelectorAll('.comment');
    existingComments.forEach(comment => comment.remove());
    
    // Add new comments
    if (comments.length > 0) {
        comments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';
            commentElement.innerHTML = `
                <p>${comment.text}</p>
                <small>Posted by ${comment.author} • ${comment.created_at}</small>
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
    setupCommentForm(noteId);
}

// Set up comment form submission
function setupCommentForm(noteId) {
    const commentForm = document.querySelector('.comments-section form');
    
    // Remove any existing event listeners
    const newCommentForm = commentForm.cloneNode(true);
    commentForm.parentNode.replaceChild(newCommentForm, commentForm);
    
    // Add new event listener
    newCommentForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const commentText = document.getElementById('comment').value.trim();
        if (!commentText) {
            alert('Please write a comment before posting.');
            return;
        }
        
        try {
            // Send POST request to create new comment
            const response = await fetch(`${API_BASE_URL}?action=comments&note_id=${noteId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: commentText,
                    author: 'Anonymous User' // You could add a name field or use a stored username
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to post comment');
            }
            
            // Refresh comments
            fetchComments(noteId);
            
            // Clear form
            e.target.reset();
        } catch (error) {
            console.error('Error posting comment:', error);
            alert(`Error: ${error.message}`);
        }
    });
}

// Fetch categories for dropdown
async function fetchCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}?action=categories`);
        if (!response.ok) throw new Error('Failed to fetch categories');
        
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

// Set up note edit and delete actions
function setupNoteActions(note) {
    const editButton = document.querySelector('#detail button.submit');
    const deleteButton = document.querySelector('#detail button.contrast');
    
    // Set up edit button
    editButton.onclick = async function() {
        // Create edit form
        const detailSection = document.querySelector('#detail');
        const contentDiv = detailSection.querySelector('.content');
        
        // Fetch categories for dropdown
        const categories = await fetchCategories();
        
        // Replace content with edit form
        contentDiv.innerHTML = `
            <form id="edit-form">
                <label for="edit-title">
                    Title
                    <input type="text" id="edit-title" value="${note.title}" required>
                </label>
                
                <label for="edit-content">
                    Content
                    <textarea id="edit-content" required>${note.content}</textarea>
                </label>
                
                <label for="edit-category">
                    Category
                    <select id="edit-category" required>
                        <option value="${note.category}" selected>${note.category}</option>
                    </select>
                </label>
                
                <div class="grid">
                    <button type="button" id="cancel-edit" class="secondary">Cancel</button>
                    <button type="submit">Save Changes</button>
                </div>
            </form>
        `;
        
        // Populate category dropdown
        const editCategorySelect = document.getElementById('edit-category');
        categories.forEach(category => {
            if (category !== note.category) {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                editCategorySelect.appendChild(option);
            }
        });
        
        // Set up cancel button
        document.getElementById('cancel-edit').onclick = function() {
            contentDiv.innerHTML = `<p>${note.content}</p>`;
        };
        
        // Set up edit form submission
        document.getElementById('edit-form').onsubmit = async function(e) {
            e.preventDefault();
            
            const title = document.getElementById('edit-title').value.trim();
            const content = document.getElementById('edit-content').value.trim();
            const category = document.getElementById('edit-category').value;
            
            if (!title || !content || !category) {
                alert('All fields are required!');
                return;
            }
            
            try {
                // Send PUT request to update note
                const response = await fetch(`${API_BASE_URL}?action=notes&id=${note.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        title: title,
                        content: content,
                        category: category
                    })
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to update note');
                }
                
                const data = await response.json();
                const updatedNote = data.data;
                
                // Update displayed note
                detailSection.querySelector('h2').textContent = updatedNote.title;
                detailSection.querySelector('p:nth-of-type(1) strong').nextSibling.textContent = ` ${updatedNote.category}`;
                contentDiv.innerHTML = `<p>${updatedNote.content}</p>`;
                
                alert('Note updated successfully!');
            } catch (error) {
                console.error('Error updating note:', error);
                alert(`Error: ${error.message}`);
            }
        };
    };
    
    // Set up delete button
    deleteButton.onclick = async function() {
        if (confirm('Are you sure you want to delete this note?')) {
            try {
                // Send DELETE request
                const response = await fetch(`${API_BASE_URL}?action=notes&id=${note.id}`, {
                    method: 'DELETE'
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to delete note');
                }
                
                // Navigate back to list
                window.location.href = 'index.html';
                
                alert('Note deleted successfully!');
            } catch (error) {
                console.error('Error deleting note:', error);
                alert(`Error: ${error.message}`);
            }
        }
    };
}

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    fetchNoteDetails();
});
