// Global variables
const API_BASE_URL = '/api.php'; // Base URL for API endpoints

// Fetch categories for dropdown
async function fetchCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}?action=categories`);
        if (!response.ok) throw new Error('Failed to fetch categories');
        
        const data = await response.json();
        const categories = data.data;
        
        // Populate category dropdown
        const formCategorySelect = document.getElementById('category');
        
        // First, ensure we keep the default option
        const defaultOption = formCategorySelect.querySelector('option[value=""]');
        formCategorySelect.innerHTML = '';
        if (defaultOption) {
            formCategorySelect.appendChild(defaultOption);
        }
        
        // Then add categories from API
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            formCategorySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

// Form submit - Create new note
document.getElementById('create-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const title = document.getElementById('title').value.trim();
    const content = document.getElementById('content').value.trim();
    const category = document.getElementById('category').value;
    
    if (!title || !content || !category) {
        alert('All fields are required!');
        return;
    }
    
    try {
        // Send POST request to create new note
        const response = await fetch(`${API_BASE_URL}?action=notes`, {
            method: 'POST',
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
            throw new Error(error.error || 'Failed to create note');
        }
        
        alert('Note created successfully!');
        e.target.reset();
        
        // Redirect to index page
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error creating note:', error);
        alert(`Error: ${error.message}`);
    }
});

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    fetchCategories();
});
