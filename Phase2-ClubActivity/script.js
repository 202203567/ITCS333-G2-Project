// Global variables
let allActivities = [];
let currentPage = 1;
let itemsPerPage = 6;
let currentView = 'listing-page';
let currentFilters = {
  search: '',
  category: '',
  sort: 'newest'
};

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

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  fetchActivities();
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
    if (e.target.matches('a[href="#detail-view"]')) {
      e.preventDefault();
      const card = e.target.closest('.club-card');
      if (card) {
        const activityId = card.dataset.id;
        showActivityDetail(activityId);
      }
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
      renderActivities();
    }
  });

  // Handle window popstate (browser back/forward)
  window.addEventListener('popstate', handleNavigation);
}

// Handle browser navigation
function handleNavigation() {
  const hash = window.location.hash.substring(1) || 'listing-page';
  showView(hash);
  
  // If we're navigating to a detail view with an ID
  if (hash.startsWith('detail-view-')) {
    const activityId = hash.replace('detail-view-', '');
    showActivityDetail(activityId);
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
    // Using JSONPlaceholder as a mock API
    const response = await fetch('https://jsonplaceholder.typicode.com/posts');
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const posts = await response.json();
    
    // Transform the data into our activities format
    allActivities = posts.slice(0, 20).map((post, index) => {
      // Create categories - randomly assign 1-2 categories
      const categories = ['Academic', 'Sports', 'Arts', 'Social', 'Service', 'Competition', 'Workshop', 'Team', 'Technology', 'Community'];
      const numCategories = Math.floor(Math.random() * 2) + 1;
      const selectedCategories = [];
      
      for (let i = 0; i < numCategories; i++) {
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        if (!selectedCategories.includes(randomCategory)) {
          selectedCategories.push(randomCategory);
        }
      }
      
      // Generate random dates (all in the near future)
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + Math.floor(Math.random() * 30) + 1);
      
      return {
        id: post.id,
        title: post.title.slice(0, 40),
        description: post.body,
        categories: selectedCategories,
        date: futureDate.toISOString().split('T')[0],
        time: '18:00',
        location: 'Campus Building ' + Math.floor(Math.random() * 10 + 1) + ', Room ' + Math.floor(Math.random() * 100 + 100),
        organizer: ['Chess Club', 'Debate Club', 'Basketball Club', 'Art Club', 'Coding Club', 'Volunteer Club'][Math.floor(Math.random() * 6)],
        capacity: Math.floor(Math.random() * 50) + 10,
        registrations: Math.floor(Math.random() * 20),
        contact: 'club' + Math.floor(Math.random() * 100) + '@campus.edu',
        comments: []
      };
    });
    
    renderActivities();
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

// Update filters and re-render
function updateFilters() {
  currentPage = 1; // Reset to first page when filters change
  currentFilters = {
    search: searchInput.value.toLowerCase(),
    category: categorySelect.value,
    sort: sortSelect.value
  };
  renderActivities();
}

// Filter and sort activities based on current filters
function getFilteredActivities() {
  return allActivities
    .filter(activity => {
      // Filter by search term
      const matchesSearch = activity.title.toLowerCase().includes(currentFilters.search) || 
                           activity.description.toLowerCase().includes(currentFilters.search);
      
      // Filter by category if selected
      const matchesCategory = !currentFilters.category || 
                             activity.categories.some(cat => cat.toLowerCase() === currentFilters.category);
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      // Apply sorting
      switch(currentFilters.sort) {
        case 'newest':
          return new Date(b.date) - new Date(a.date);
        case 'oldest':
          return new Date(a.date) - new Date(b.date);
        case 'name-asc':
          return a.title.localeCompare(b.title);
        case 'name-desc':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });
}

// Render activities grid with pagination
function renderActivities() {
  const filteredActivities = getFilteredActivities();
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  
  // Ensure current page is valid
  if (currentPage > totalPages) {
    currentPage = Math.max(1, totalPages);
  }
  
  // Calculate the range of items to display
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredActivities.length);
  const currentActivities = filteredActivities.slice(startIndex, endIndex);
  
  // Clear the grid
  clubGrid.innerHTML = '';
  
  if (currentActivities.length === 0) {
    clubGrid.innerHTML = '<div class="no-results">No activities match your search criteria.</div>';
    return;
  }
  
  // Render each activity card
  currentActivities.forEach(activity => {
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
      <img src="/api/placeholder/300/160" alt="${activity.title}">
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
function showActivityDetail(activityId) {
  const activity = allActivities.find(a => a.id.toString() === activityId.toString());
  
  if (!activity) {
    console.error('Activity not found:', activityId);
    return;
  }
  
  // Update URL without triggering navigation event
  window.history.pushState(null, '', `#detail-view-${activityId}`);
  
  // Show detail view
  showView('detail-view');
  
  // Populate detail view with activity data
  const detailHeader = detailSection.querySelector('header');
  detailHeader.innerHTML = `
    <h2>${activity.title}</h2>
    <div>
      ${activity.categories.map(cat => `<span class="club-badge">${cat}</span>`).join('')}
    </div>
  `;
  
  const detailImage = detailSection.querySelector('img');
  detailImage.src = '/api/placeholder/800/400';
  detailImage.alt = activity.title;
  
  const detailGrid = detailSection.querySelector('.grid');
  detailGrid.innerHTML = `
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
      <p>${activity.organizer}</p>
    </div>
  `;
  
  // Description paragraphs
  const descriptionH4 = detailSection.querySelector('h4:nth-of-type(1)');
  let descriptionParagraphs = activity.description.split('\n\n');
  
  // Clear existing paragraphs
  while (descriptionH4.nextElementSibling && descriptionH4.nextElementSibling.tagName === 'P') {
    descriptionH4.nextElementSibling.remove();
  }
  
  // Add new paragraphs
  descriptionParagraphs.forEach(para => {
    const p = document.createElement('p');
    p.textContent = para;
    descriptionH4.parentNode.insertBefore(p, descriptionH4.nextSibling);
  });
  
  // Additional info
  const additionalInfoH4 = detailSection.querySelector('h4:nth-of-type(2)');
  const additionalInfoUl = additionalInfoH4.nextElementSibling;
  
  additionalInfoUl.innerHTML = `
    <li>Registration starts 30 minutes before event</li>
    <li>Expected to finish in approximately 3 hours</li>
    <li>Maximum capacity: ${activity.capacity} participants</li>
    <li>Current registrations: ${activity.registrations}</li>
    <li>Contact: ${activity.contact}</li>
  `;
  
  // Setup actions
  const registerButton = detailSection.querySelector('.club-actions button:nth-of-type(1)');
  registerButton.addEventListener('click', () => registerForActivity(activity.id));
  
  // Refresh comments
  renderComments(activity);
}

// Render comments for an activity
function renderComments(activity) {
  const commentsSection = detailSection.querySelector('.comments-section');
  commentsSection.innerHTML = '';
  
  if (!activity.comments || activity.comments.length === 0) {
    const noComments = document.createElement('p');
    noComments.textContent = 'No comments yet. Be the first to comment!';
    commentsSection.appendChild(noComments);
    return;
  }
  
  activity.comments.forEach(comment => {
    const commentArticle = document.createElement('article');
    commentArticle.className = 'comment';
    commentArticle.innerHTML = `
      <div class="comment-header">
        <span class="comment-author">${comment.author}</span>
        <span class="comment-date">${formatDate(comment.date)}</span>
      </div>
      <p>${comment.text}</p>
    `;
    commentsSection.appendChild(commentArticle);
  });
}

// Handle creation form submission
function handleCreateSubmit(e) {
  e.preventDefault();
  
  // Validate form
  if (!validateCreateForm()) {
    return;
  }
  
  // Show loading state
  const submitButton = createForm.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  submitButton.textContent = 'Creating...';
  submitButton.disabled = true;
  
  // Gather form data
  const formData = new FormData(createForm);
  const categoryCheckboxes = createForm.querySelectorAll('input[name="category[]"]:checked');
  const categories = Array.from(categoryCheckboxes).map(cb => cb.value);
  
  // Create new activity object
  const newActivity = {
    id: Date.now(), // Use timestamp as ID
    title: formData.get('activity-name'),
    date: formData.get('activity-date'),
    time: formData.get('activity-time'),
    location: formData.get('activity-location'),
    organizer: formData.get('activity-club'),
    categories: categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)), // Capitalize categories
    description: formData.get('activity-description'),
    capacity: formData.get('activity-capacity') || 0,
    registrations: 0,
    contact: formData.get('activity-contact'),
    comments: []
  };
  
  // Simulate API request
  setTimeout(() => {
    // Add to activities array
    allActivities.unshift(newActivity);
    
    // Reset form
    createForm.reset();
    
    // Reset button
    submitButton.textContent = originalText;
    submitButton.disabled = false;
    
    // Show success message
    alert('Activity created successfully!');
    
    // Navigate to listing page
    showView('listing-page');
    renderActivities();
  }, 1000);
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
  
  // Date validation - ensure it's in the future
  const dateField = document.getElementById('activity-date');
  if (dateField.value) {
    const selectedDate = new Date(dateField.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
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

// Handle comment form submission
function handleCommentSubmit(e) {
  e.preventDefault();
  
  const commentText = document.getElementById('comment').value.trim();
  if (!commentText) {
    alert('Please enter a comment');
    return;
  }
  
  // Get current activity ID from URL
  const hash = window.location.hash;
  const activityId = hash.replace('#detail-view-', '');
  const activity = allActivities.find(a => a.id.toString() === activityId);
  
  if (!activity) {
    console.error('Activity not found');
    return;
  }
  
  // Create new comment
  const newComment = {
    id: Date.now(),
    author: 'Current User',
    date: new Date().toISOString().split('T')[0],
    text: commentText
  };
  
  // Add comment to activity
  if (!activity.comments) {
    activity.comments = [];
  }
  activity.comments.push(newComment);
  
  // Clear form and render comments
  document.getElementById('comment').value = '';
  renderComments(activity);
}

// Register for an activity
function registerForActivity(activityId) {
  const activity = allActivities.find(a => a.id === activityId);
  
  if (!activity) {
    return;
  }
  
  // Check if capacity reached
  if (activity.registrations >= activity.capacity) {
    alert('This activity has reached maximum capacity.');
    return;
  }
  
  // Simulate registration
  activity.registrations++;
  
  // Update UI
  alert('You have successfully registered for this activity!');
  showActivityDetail(activityId);
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
    background: #f5f5f5;
    border-radius: 8px;
    margin: 1rem 0;
  }
  
  .error-message {
    background: #ffebee;
    color: #c62828;
  }
  
  input[aria-invalid="true"], 
  select[aria-invalid="true"], 
  textarea[aria-invalid="true"] {
    border-color: red !important;
  }
`;
document.head.appendChild(style);
