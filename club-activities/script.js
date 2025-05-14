// Global variables
let allActivities = [];
let currentPage = 1;
let itemsPerPage = 6;
let totalPages = 1;
let currentView = 'listing-page';
let currentFilters = {
  search: '',
  category: '',
  sort: 'newest'
};
let editingActivityId = null;

// DOM Elements
const listingSection = document.getElementById('listing-page');
const creationSection = document.getElementById('creation-form');
const detailSection = document.getElementById('detail-view');
const clubGrid = document.querySelector('.club-grid');
const paginationNav = document.querySelector('.pagination');
const searchInput = document.getElementById('search');
const categorySelect = document.getElementById('category');
const sortSelect = document.getElementById('sort');
const createForm = document.querySelector('#creation-form form');
const commentForm = document.querySelector('#detail-view form');

// API URLs
const apiUrl = 'https://9410da3b-706d-4938-82cd-9c5990694d4e-00-1p2t0tp1gdlq2.pike.replit.dev/club-activities/activities-api.php';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  fetchActivities();
  fetchClubs();
  handleNavigation();
});

// Setup event listeners
function setupEventListeners() {
  // Navigation
  document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      showView(targetId);
    });
  });

  // Search and filter controls
  searchInput.addEventListener('input', updateFilters);
  categorySelect.addEventListener('change', updateFilters);
  sortSelect.addEventListener('change', updateFilters);

  // Form submissions
  createForm.addEventListener('submit', handleCreateSubmit);
  commentForm.addEventListener('submit', handleCommentSubmit);

  // Handle view details links
  clubGrid.addEventListener('click', (e) => {
    if (e.target.matches('a[href^="#detail-view"]')) {
      e.preventDefault();
      const activityId = e.target.getAttribute('href').split('-')[2];
      showActivityDetail(activityId);
    }
  });

  // Setup pagination
  paginationNav.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      e.preventDefault();
      if (e.target.textContent === 'Next »') {
        currentPage++;
      } else if (e.target.textContent === '« Previous') {
        currentPage = Math.max(1, currentPage - 1);
      } else {
        currentPage = parseInt(e.target.textContent);
      }
      fetchActivities();
    }
  });

  // Handle window popstate (browser back/forward)
  window.addEventListener('popstate', handleNavigation);
}

// Handle browser navigation
function handleNavigation() {
  const hash = window.location.hash.substring(1) || 'listing-page';
  
  // If we're navigating to a detail view with an ID
  if (hash.startsWith('detail-view-')) {
    const activityId = hash.replace('detail-view-', '');
    showActivityDetail(activityId);
  } else {
    showView(hash);
  }
}

// Show the appropriate view
function showView(viewId) {
  // Extract the base view ID without any parameter
  const baseViewId = viewId.split('-').slice(0, 2).join('-');
  
  // Hide all sections
  listingSection.style.display = 'none';
  creationSection.style.display = 'none';
  detailSection.style.display = 'none';
  
  // Show the requested section
  if (baseViewId === 'listing-page') {
    listingSection.style.display = 'block';
    currentView = 'listing-page';
    window.location.hash = 'listing-page';
  } else if (baseViewId === 'creation-form') {
    creationSection.style.display = 'block';
    currentView = 'creation-form';
    window.location.hash = 'creation-form';
  } else if (baseViewId === 'detail-view') {
    detailSection.style.display = 'block';
    currentView = 'detail-view';
    // If there's no specific activity ID, we don't update the hash
    if (viewId === 'detail-view') {
      window.location.hash = 'detail-view';
    }
  }
}

// Fetch activities from API
async function fetchActivities() {
  // Show loading state
  clubGrid.innerHTML = '<div class="loading">Loading activities...</div>';
  
  try {
    const url = new URL(apiUrl, window.location.href);
    url.searchParams.append('route', 'activities');
    url.searchParams.append('page', currentPage);
    url.searchParams.append('limit', itemsPerPage);
    
    if (currentFilters.search) {
      url.searchParams.append('search', currentFilters.search);
    }
    
    if (currentFilters.category) {
      url.searchParams.append('category', currentFilters.category);
    }
    
    url.searchParams.append('sort', currentFilters.sort);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'success') {
      allActivities = data.activities;
      totalPages = data.total_pages;
      renderActivities();
    } else {
      throw new Error(data.message || 'Unknown error');
    }
  } catch (error) {
    console.error('Error fetching activities:', error);
    clubGrid.innerHTML = `
      <div class="error-message">
        <h3>Error loading activities</h3>
        <p>${error.message}</p>
        <button onclick="fetchActivities()">Try Again</button>
      </div>
    `;
  }
}

// Fetch clubs from API
async function fetchClubs() {
  try {
    const url = new URL(apiUrl, window.location.href);
    url.searchParams.append('route', 'clubs');
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'success') {
      const clubSelect = document.getElementById('activity-club');
      clubSelect.innerHTML = '<option value="">Select club</option>';
      
      data.clubs.forEach(club => {
        const option = document.createElement('option');
        option.value = club.id;
        option.textContent = club.name;
        clubSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error fetching clubs:', error);
  }
}

// Update filters and re-render
function updateFilters() {
  currentPage = 1; // Reset to first page when filters change
  currentFilters = {
    search: searchInput.value.toLowerCase(),
    category: categorySelect.value,
    sort: sortSelect.value
  };
  fetchActivities();
}

// Render activities grid with pagination
function renderActivities() {
  // Clear the grid
  clubGrid.innerHTML = '';
  
  if (allActivities.length === 0) {
    clubGrid.innerHTML = '<div class="no-results">No activities match your search criteria.</div>';
    renderPagination(totalPages);
    return;
  }
  
  // Render each activity card
  allActivities.forEach(activity => {
    clubGrid.appendChild(createActivityCard(activity));
  });
  
  // Update pagination
  renderPagination(totalPages);
}

// Create an activity card element
function createActivityCard(activity) {
  const card = document.createElement('article');
  card.className = 'club-card';
  card.dataset.id = activity.id;
  
  card.innerHTML = `
    <div class="club-image">
      <img src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fcdn.photographylife.com%2Fwp-content%2Fuploads%2F2014%2F09%2FNikon-D750-Image-Samples-2.jpg&f=1&nofb=1&ipt=adb882c8eda62ed47d40a4affd4bc6d3788da105a043ef1dcc668690d1861bde" alt="${activity.title}">
    </div>
    <div class="club-content">
      <h3>${activity.title}</h3>
      <div>
        ${activity.categories.map(cat => `<span class="club-badge">${cat}</span>`).join('')}
      </div>
      <small>Date: ${formatDate(activity.date)}</small>
      <p>${activity.description.substring(0, 100)}...</p>
      <a href="#detail-view-${activity.id}" role="button" class="outline">View Details</a>
    </div>
  `;
  
  return card;
}

// Render pagination controls
function renderPagination(totalPages) {
  // Clear current pagination
  paginationNav.innerHTML = '';
  
  if (totalPages <= 1) {
    return; // Don't show pagination if there's only one page
  }
  
  // Previous button
  const prevButton = document.createElement('button');
  prevButton.className = 'outline';
  prevButton.textContent = '« Previous';
  prevButton.disabled = currentPage === 1;
  paginationNav.appendChild(prevButton);
  
  // Page numbers
  const maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  
  // Adjust start page if needed
  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement('button');
    pageButton.textContent = i.toString();
    pageButton.className = i === currentPage ? '' : 'outline';
    paginationNav.appendChild(pageButton);
  }
  
  // Next button
  const nextButton = document.createElement('button');
  nextButton.className = 'outline';
  nextButton.textContent = 'Next »';
  nextButton.disabled = currentPage === totalPages;
  paginationNav.appendChild(nextButton);
}

// Show activity details
async function showActivityDetail(activityId) {
  try {
    showView('detail-view');
    
    // Update URL without triggering navigation event
    window.history.pushState(null, '', `#detail-view-${activityId}`);
    
    // Show loading state
    detailSection.querySelector('article').innerHTML = '<div class="loading">Loading activity details...</div>';
    
    const url = new URL(apiUrl, window.location.href);
    url.searchParams.append('route', 'activity');
    url.searchParams.append('id', activityId);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'success') {
      const activity = data.activity;
      updateDetailView(activity);
      fetchComments(activityId);
    } else {
      throw new Error(data.message || 'Unknown error');
    }
  } catch (error) {
    console.error('Error fetching activity details:', error);
    detailSection.querySelector('article').innerHTML = `
      <div class="error-message">
        <h3>Error loading activity details</h3>
        <p>${error.message}</p>
        <button onclick="showActivityDetail(${activityId})">Try Again</button>
      </div>
    `;
  }
}

// Update detail view with activity data
function updateDetailView(activity) {
  const detailArticle = detailSection.querySelector('article');
  
  detailArticle.innerHTML = `
    <div class="activity-header">
      <h2>${activity.title}</h2>
      <div class="activity-categories">
        ${activity.categories.map(cat => `<span class="club-badge">${cat}</span>`).join('')}
      </div>
    </div>
    
    <img src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fcdn.photographylife.com%2Fwp-content%2Fuploads%2F2014%2F09%2FNikon-D750-Image-Samples-2.jpg&f=1&nofb=1&ipt=adb882c8eda62ed47d40a4affd4bc6d3788da105a043ef1dcc668690d1861bde" alt="${activity.title}" style="width: 100%; height: auto; margin: 1rem 0;">
    
    <div class="grid">
      <div>
        <h4>Date & Time</h4>
        <p>${formatDate(activity.date)} at ${formatTime(activity.time)}</p>
      </div>
      <div>
        <h4>Location</h4>
        <p>${activity.location}</p>
      </div>
      <div>
        <h4>Organizer</h4>
        <p>${activity.club_name}</p>
      </div>
    </div>
    
    <h4>Description</h4>
    ${activity.description.split('\n\n').map(para => `<p>${para}</p>`).join('')}
    
    <h4>Additional Information</h4>
    <ul>
      <li>Registration starts 30 minutes before event</li>
      <li>Expected to finish in approximately 3 hours</li>
      <li>Maximum capacity: ${activity.capacity > 0 ? activity.capacity : 'Unlimited'} participants</li>
      <li>Current registrations: ${activity.registrations}</li>
      <li>Contact: ${activity.contact}</li>
    </ul>
    
    <div class="club-actions">
      <button onclick="registerForActivity(${activity.id})">Register</button>
      <button class="secondary" onclick="saveToCalendar(${activity.id})">Save to Calendar</button>
      <button class="outline" onclick="editActivity(${activity.id})">Edit</button>
      <button class="outline contrast" onclick="deleteActivity(${activity.id})">Delete</button>
    </div>
  `;
}

// Fetch comments for an activity
async function fetchComments(activityId) {
  try {
    const url = new URL(apiUrl, window.location.href);
    url.searchParams.append('route', 'comments');
    url.searchParams.append('activity_id', activityId);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'success') {
      renderComments(data.comments);
    } else {
      throw new Error(data.message || 'Unknown error');
    }
  } catch (error) {
    console.error('Error fetching comments:', error);
    const commentsSection = detailSection.querySelector('.comments-section');
    commentsSection.innerHTML = `
      <div class="error-message">
        <p>Error loading comments: ${error.message}</p>
        <button onclick="fetchComments(${activityId})">Try Again</button>
      </div>
    `;
  }
}

// Render comments for an activity
function renderComments(comments) {
  const commentsSection = detailSection.querySelector('.comments-section');
  commentsSection.innerHTML = '';
  
  if (!comments || comments.length === 0) {
    const noComments = document.createElement('p');
    noComments.textContent = 'No comments yet. Be the first to comment!';
    commentsSection.appendChild(noComments);
    return;
  }
  
  comments.forEach(comment => {
    const commentArticle = document.createElement('article');
    commentArticle.className = 'comment';
    commentArticle.innerHTML = `
      <div class="comment-header">
        <span class="comment-author">${comment.author}</span>
        <span class="comment-date">${formatDate(comment.created_at)}</span>
      </div>
      <p>${comment.text}</p>
    `;
    commentsSection.appendChild(commentArticle);
  });
}

// Handle creation form submission
async function handleCreateSubmit(e) {
  e.preventDefault();
  
  // Validate form
  if (!validateCreateForm()) {
    return;
  }
  
  // Show loading state
  const submitButton = createForm.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  submitButton.textContent = editingActivityId ? 'Updating...' : 'Creating...';
  submitButton.disabled = true;
  
  // Gather form data
  const formData = new FormData(createForm);
  const categoryCheckboxes = createForm.querySelectorAll('input[name="category[]"]:checked');
  const categories = Array.from(categoryCheckboxes).map(cb => cb.value);
  
  // Create activity data object
  const activityData = {
    title: formData.get('activity-name'),
    date: formData.get('activity-date'),
    time: formData.get('activity-time'),
    location: formData.get('activity-location'),
    club_id: formData.get('activity-club'),
    description: formData.get('activity-description'),
    capacity: formData.get('activity-capacity') || 0,
    contact: formData.get('activity-contact'),
    categories: categories
  };
  
  try {
    const url = new URL(apiUrl, window.location.href);
    url.searchParams.append('route', 'activities');
    
    let method = 'POST';
    
    // If we're editing an existing activity
    if (editingActivityId) {
      url.searchParams.append('id', editingActivityId);
      method = 'PUT';
    }
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(activityData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'success') {
      // Reset form and editing state
      createForm.reset();
      editingActivityId = null;
      
      // Update button text
      const formTitle = document.querySelector('#creation-form .section-title');
      formTitle.textContent = 'Create New Club Activity';
      submitButton.textContent = 'Create Activity';
      
      // Show success message
      alert(editingActivityId ? 'Activity updated successfully!' : 'Activity created successfully!');
      
      // Navigate to listing page
      currentPage = 1;
      currentFilters = {
        search: '',
        category: '',
        sort: 'newest'
      };
      
      fetchActivities();
      
      // If we were editing, go back to the detail view
      if (editingActivityId) {
        showActivityDetail(editingActivityId);
      } else {
        showView('listing-page');
      }
    } else {
      throw new Error(data.message || 'Unknown error');
    }
  } catch (error) {
    console.error('Error saving activity:', error);
    alert(`Error saving activity: ${error.message}`);
  } finally {
    // Reset button
    submitButton.textContent = originalText;
    submitButton.disabled = false;
  }
}

// Handle comment form submission
async function handleCommentSubmit(e) {
  e.preventDefault();
  
  const commentText = document.getElementById('comment').value.trim();
  if (!commentText) {
    alert('Please enter a comment');
    return;
  }
  
  // Get current activity ID from URL
  const hash = window.location.hash;
  const activityId = hash.replace('#detail-view-', '');
  
  try {
    const url = new URL(apiUrl, window.location.href);
    url.searchParams.append('route', 'comments');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        activity_id: activityId,
        author: 'Anonymous',
        text: commentText
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'success') {
      // Clear form and refresh comments
      document.getElementById('comment').value = '';
      fetchComments(activityId);
    } else {
      throw new Error(data.message || 'Unknown error');
    }
  } catch (error) {
    console.error('Error adding comment:', error);
    alert(`Error adding comment: ${error.message}`);
  }
}

// Register for an activity
async function registerForActivity(activityId) {
  try {
    const url = new URL(apiUrl, window.location.href);
    url.searchParams.append('route', 'register');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        activity_id: activityId,
        user_name: 'Anonymous'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'success') {
      alert('You have successfully registered for this activity!');
      showActivityDetail(activityId);
    } else {
      throw new Error(data.message || 'Unknown error');
    }
  } catch (error) {
    console.error('Error registering for activity:', error);
    alert(`Registration failed: ${error.message}`);
  }
}

// Save activity to calendar
function saveToCalendar(activityId) {
  alert('Calendar feature is not implemented yet.');
}

// Edit an activity
async function editActivity(activityId) {
  try {
    // Get activity details
    const url = new URL(apiUrl, window.location.href);
    url.searchParams.append('route', 'activity');
    url.searchParams.append('id', activityId);
    
    // Show loading state
    const formTitle = document.querySelector('#creation-form .section-title');
    formTitle.textContent = 'Loading Activity Data...';
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'success') {
      // Set editing state
      editingActivityId = activityId;
      
      // Update form title
      formTitle.textContent = 'Edit Club Activity';
      
      // Update form submit button
      const submitButton = createForm.querySelector('button[type="submit"]');
      submitButton.textContent = 'Update Activity';
      
      // Populate form with activity data
      const activity = data.activity;
      
      document.getElementById('activity-name').value = activity.title;
      document.getElementById('activity-date').value = activity.date;
      document.getElementById('activity-time').value = activity.time;
      document.getElementById('activity-location').value = activity.location;
      document.getElementById('activity-club').value = activity.club_id;
      document.getElementById('activity-description').value = activity.description;
      document.getElementById('activity-capacity').value = activity.capacity;
      document.getElementById('activity-contact').value = activity.contact;
      
      // Reset all category checkboxes
      createForm.querySelectorAll('input[name="category[]"]').forEach(cb => {
        cb.checked = false;
      });
      
      // Check the categories that the activity has
      activity.categories.forEach(categoryName => {
        // Find the checkbox with this category
        const checkboxes = createForm.querySelectorAll('input[name="category[]"]');
        
        // Map of category names to IDs
        const categoryMap = {
          'Academic': 1,
          'Sports': 2,
          'Arts': 3,
          'Social': 4,
          'Service': 5,
          'Competition': 6,
          'Workshop': 7,
          'Team': 8, 
          'Technology': 9,
          'Community': 10
        };
        
        // ID for this category name
        const categoryId = categoryMap[categoryName];
        
        if (categoryId) {
          // Find and check the checkbox
          const checkbox = document.getElementById(`category-${categoryName.toLowerCase()}`);
          if (checkbox) {
            checkbox.checked = true;
          }
        }
      });
      
      // Show the form
      showView('creation-form');
    } else {
      throw new Error(data.message || 'Unknown error');
    }
  } catch (error) {
    console.error('Error loading activity for editing:', error);
    alert(`Error loading activity for editing: ${error.message}`);
    
    // Reset editing state
    editingActivityId = null;
    
    // Update form title
    const formTitle = document.querySelector('#creation-form .section-title');
    formTitle.textContent = 'Create New Club Activity';
  }
}

// Delete an activity
async function deleteActivity(activityId) {
  if (!confirm('Are you sure you want to delete this activity?')) {
    return;
  }
  
  try {
    const url = new URL(apiUrl, window.location.href);
    url.searchParams.append('route', 'activities');
    url.searchParams.append('id', activityId);
    
    const response = await fetch(url, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'success') {
      alert('Activity deleted successfully!');
      showView('listing-page');
      fetchActivities();
    } else {
      throw new Error(data.message || 'Unknown error');
    }
  } catch (error) {
    console.error('Error deleting activity:', error);
    alert(`Error deleting activity: ${error.message}`);
  }
}

// Validate creation form
function validateCreateForm() {
  // Remove any existing error messages
  createForm.querySelectorAll('.error-message').forEach(el => el.remove());
  
  let isValid = true;
  
  // Required fields
  const requiredFields = [
    'activity-name', 
    'activity-date', 
    'activity-club',
    'activity-time',
    'activity-location',
    'activity-description',
    'activity-contact'
  ];
  
  requiredFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (!field.value.trim()) {
      showValidationError(field, 'This field is required');
      isValid = false;
    }
  });
  
  // Email validation
  const emailField = document.getElementById('activity-contact');
  if (emailField.value && !isValidEmail(emailField.value)) {
    showValidationError(emailField, 'Please enter a valid email address');
    isValid = false;
  }
  
  // Date validation - ensure it's in the future for new activities only
  // For editing existing activities, we'll accept any valid date
  const dateField = document.getElementById('activity-date');
  if (dateField.value) {
    const selectedDate = new Date(dateField.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // If creating a new activity (not editing), validate that date is in future
    if (!editingActivityId && selectedDate < today) {
      showValidationError(dateField, 'Please select a future date');
      isValid = false;
    }
  }
  
  // Category validation - at least one category should be selected
  const categories = Array.from(createForm.querySelectorAll('input[name="category[]"]:checked'));
  if (categories.length === 0) {
    const categorySection = document.getElementById('activity-category');
    showValidationError(categorySection, 'Please select at least one category');
    isValid = false;
  }
  
  return isValid;
}

// Helper function to show validation error
function showValidationError(field, message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.style.color = 'red';
  errorDiv.style.fontSize = '0.8rem';
  errorDiv.style.marginTop = '0.25rem';
  errorDiv.textContent = message;
  
  field.parentNode.appendChild(errorDiv);
  field.setAttribute('aria-invalid', 'true');
}

// Helper function to validate email
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Format date to more readable format
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

// Format time
function formatTime(timeString) {
  if (!timeString) return '';
  
  try {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  } catch (e) {
    return timeString;
  }
}

// Add some CSS for loading and error states
const style = document.createElement('style');
style.textContent = `
  .loading, .error-message, .no-results {
    padding: 2rem;
    text-align: center;
    width: 100%;
    background: var(--card-background-color);
    border-radius: 8px;
    margin: 1rem 0;
    border: 1px solid var(--card-border-color);
  }
  
  .error-message {
    background-color: rgba(220, 38, 38, 0.2);
    color: #ef4444;
    border-color: #ef4444;
  }
  
  input[aria-invalid="true"], 
  select[aria-invalid="true"], 
  textarea[aria-invalid="true"] {
    border-color: #ef4444 !important;
  }
  
  /* Improved detail view styling */
  .activity-header {
    margin-bottom: 1.5rem;
  }
  
  .activity-header h2 {
    font-size: 2.2rem;
    margin-bottom: 0.75rem;
  }
  
  .activity-categories {
    margin-bottom: 1rem;
  }
  
  .club-detail {
    padding: 2rem;
  }`;
