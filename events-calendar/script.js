const eventsList = document.querySelector('.events-list');
const searchInput = document.getElementById('search');
const categorySelect = document.getElementById('category');
const dateRangeSelect = document.getElementById('date-range');
const sortSelect = document.getElementById('sort');
const paginationElement = document.querySelector('.pagination ul');
const eventsPerPage = 4;
const API_URL = "https://ce1e4852-9e1a-4d4d-8cd7-6a7524b7b7dc-00-3he6dfxbqutl3.pike.replit.dev/"

let events = [];          // Stores all events from API
let filteredEvents = [];  // Stores filtered events based on search/filter criteria
let currentPage = 1;      // Current page in pagination

/**
 * Fetches events data from the API and initializes the page
 */
async function fetchEvents() {
  showLoading(true);
  try {
    const response = await fetch(`${API_URL}?action=events`);
    if (!response.ok) {
      throw new Error(`Failed to load events data! Status: ${response.status}`);
    }
    const data = await response.json();
    if (!data.events || data.events.length === 0) {
      throw new Error("No events found in the data file.");
    }
    events = data.events;
    filteredEvents = [...events];
    applyFilters();
    renderEvents();
    setupPagination();
    enableControls(true);
  } catch (error) {
    console.error("Error loading events data:", error);
    showError("Failed to load events. Server is down!");
    enableControls(false);
  } finally {
    showLoading(false);
  }
}

/**
 * Shows/hides loading indicator
 * @param {boolean} isLoading - Whether to show or hide the loading indicator
 */
function showLoading(isLoading) {
  if (isLoading) {
    const loadingEl = document.createElement('div');
    loadingEl.id = 'loading-indicator';
    loadingEl.className = 'loading-indicator';
    loadingEl.innerHTML = '<div>Loading events...</div>';
    if (eventsList) {
      eventsList.innerHTML = '';
      eventsList.appendChild(loadingEl);
    }
  } else {
    const loadingEl = document.getElementById('loading-indicator');
    if (loadingEl) {
      loadingEl.remove();
    }
  }
}

/**
 * Displays an error message to the user
 * @param {string} message - Error message to display
 */
function showError(message) {
  const errorEl = document.createElement('div');
  errorEl.className = 'error-message';
  errorEl.innerHTML = `<p>${message}</p>`;
  if (eventsList) {
    eventsList.innerHTML = '';
    eventsList.appendChild(errorEl);
  } else {
    document.getElementsByTagName('body')[0].innerHTML = '';
    document.getElementsByTagName('body')[0].appendChild(errorEl);
  }
}

/**
 * Enables/disables UI controls based on data loading state
 * @param {boolean} enable - Whether to enable or disable controls
 */
function enableControls(enable) {
  const controls = [
    searchInput,
    categorySelect,
    dateRangeSelect,
    sortSelect,
    document.querySelector('.controls a[role="button"]')
  ];
  
  // Enable/disable all control elements
  controls.forEach(control => {
    if (control) {
      control.disabled = !enable;
      
      // Special handling for anchor elements
      if (control.tagName === 'A') {
        if (enable) {
          control.removeAttribute('aria-disabled');
          control.style.pointerEvents = '';
          control.style.opacity = '';
        } else {
          control.setAttribute('aria-disabled', 'true');
          control.style.pointerEvents = 'none';
          control.style.opacity = '0.5';
        }
      }
    }
  });
  
  // Enable/disable pagination links separately
  if (paginationElement) {
    const paginationLinks = paginationElement.querySelectorAll('a');
    paginationLinks.forEach(link => {
      if (enable) {
        link.style.pointerEvents = '';
        link.style.opacity = '';
      } else {
        link.style.pointerEvents = 'none';
        link.style.opacity = '0.5';
      }
    });
  }
}

/**
 * Applies search, category, date range, and sort filters to events
 * Updates the filteredEvents array with filtered results
 */
function applyFilters() {
  const searchTerm = searchInput?.value.toLowerCase() || '';
  const category = categorySelect?.value || '';
  const dateRange = dateRangeSelect?.value || 'year';
  const sortOrder = sortSelect?.value || 'asc';
  
  // Filter events based on search, category, and date range
  filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm) || 
                         event.description.toLowerCase().includes(searchTerm);
    const matchesCategory = category === '' || 
                           event.category.toLowerCase() === category.toLowerCase();
    const matchesDate = isInDateRange(event.date, dateRange);
    return matchesSearch && matchesCategory && matchesDate;
  });
  
  // Sort filtered events by date
  filteredEvents.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });
  
  // Reset to first page when filters change
  currentPage = 1;
}

/**
 * Checks if a date is within the specified range
 * @param {string} dateString - ISO date string to check
 * @param {string} range - Range type ('today', 'week', 'month', 'year')
 * @returns {boolean} - Whether the date is in the specified range
 */
function isInDateRange(dateString, range) {
  const eventDate = new Date(dateString);
  const today = new Date();
  
  switch (range) {
    case 'today': 
      return eventDate.toDateString() === today.toDateString();
    case 'week': 
      const weekAhead = new Date();
      weekAhead.setDate(today.getDate() + 7);
      return eventDate >= today && eventDate <= weekAhead;
    case 'month': 
      return eventDate.getMonth() === today.getMonth() && 
             eventDate.getFullYear() === today.getFullYear();
    case 'year': 
    default:
      return eventDate.getFullYear() === today.getFullYear();
  }
}

/**
 * Renders the current page of events to the DOM
 * Shows appropriate message if no events match the filters
 */
function renderEvents() {
  if (!eventsList) return;
  eventsList.innerHTML = '';
  
  // Calculate pagination range
  const startIndex = (currentPage - 1) * eventsPerPage;
  const endIndex = startIndex + eventsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, endIndex);
  
  // Show message if no events match filters
  if (paginatedEvents.length === 0) {
    eventsList.innerHTML = '<div class="no-events">No events found matching your criteria.</div>';
    return;
  }
  
  // Render each event as a card
  paginatedEvents.forEach(event => {
    const eventCard = document.createElement('article');
    eventCard.className = 'event-card';
    eventCard.innerHTML = `
      <div class="event-date">${formatDate(event.date)}</div>
      <h3>${event.title}</h3>
      <p>${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}</p>
      <div>
        <a href="details.html?id=${event.id}" class="view-details" data-id="${event.id}">View Details</a>
      </div>
    `;
    eventsList.appendChild(eventCard);
  });
}

/**
 * Formats a date string to a more readable format
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date string
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

/**
 * Creates and sets up pagination controls
 * Updates active page and handles pagination navigation
 */
function setupPagination() {
  if (!paginationElement) return;
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
  paginationElement.innerHTML = '';
  
  // Create "Previous" button
  const prevLi = document.createElement('li');
  const prevLink = document.createElement('a');
  prevLink.href = '#';
  prevLink.innerHTML = '&lt;';
  prevLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentPage > 1) {
      currentPage--;
      renderEvents();
      setupPagination();
    }
  });
  prevLi.appendChild(prevLink);
  paginationElement.appendChild(prevLi);
  
  // Create numbered page buttons
  for (let i = 1; i <= totalPages; i++) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = i;
    if (i === currentPage) {
      a.setAttribute('aria-current', 'page');
    }
    a.addEventListener('click', (e) => {
      e.preventDefault();
      currentPage = i;
      renderEvents();
      setupPagination();
    });
    li.appendChild(a);
    paginationElement.appendChild(li);
  }
  
  // Create "Next" button
  const nextLi = document.createElement('li');
  const nextLink = document.createElement('a');
  nextLink.href = '#';
  nextLink.innerHTML = '&gt;';
  nextLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentPage < totalPages) {
      currentPage++;
      renderEvents();
      setupPagination();
    }
  });
  nextLi.appendChild(nextLink);
  paginationElement.appendChild(nextLi);
}

/**
 * Loads event details from API and populates the details page
 * Redirects to index page if event not found
 */
function loadEventDetails() {
  // Check if we're on the details page
  const eventHeader = document.querySelector('.event-header');
  if (!eventHeader) return;
  
  const eventId = new URLSearchParams(window.location.search).get('id')
  if (!eventId) {
    window.location.href = 'index.html';
    return;
  }
  
  // Make sure article and footer are hidden while loading
  const articleElement = document.querySelector('article');
  const footerElement = document.querySelector('footer');
  
  if (articleElement) articleElement.classList.add('loading-hidden');
  if (footerElement) footerElement.classList.add('loading-hidden');
  
  // Create loading element in the body
  const loadingEl = document.createElement('div');
  loadingEl.id = 'loading-indicator';
  loadingEl.className = 'loading-indicator';
  loadingEl.innerHTML = '<div>Loading event details...</div>';
  
  // Add loading indicator to the body before the article
  if (articleElement && articleElement.parentNode) {
    articleElement.parentNode.insertBefore(loadingEl, articleElement);
  }
  
  // Add loading styles
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .loading-indicator {
      text-align: center;
      padding: 2rem;
      font-size: 1.2rem;
      color: #666;
    }
    .error-message {
      background-color: #ffeded;
      border-left: 4px solid #e74c3c;
      padding: 1rem;
      margin: 1rem 0;
      border-radius: 4px;
      text-align: center;
    }
    .loading-hidden {
      display: none;
    }
  `;
  
  if (!document.querySelector('style#loading-styles')) {
    styleEl.id = 'loading-styles';
    document.head.appendChild(styleEl);
  }
  
  fetch(`${API_URL}?action=events&id=${eventId}`)
    .then(response => {
      if (response.status!=200 && response.status!=404) {
        throw new Error(`Failed to load event details. Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (!data.error) {
        // Remove loading indicator
        const loadingEl = document.getElementById('loading-indicator');
        if (loadingEl) loadingEl.remove();
        
        populateEventDetails(data);
        if (articleElement) articleElement.classList.remove('loading-hidden');
        if (footerElement) footerElement.classList.remove('loading-hidden');
        setupDeleteButton();
      } else {
        console.log("Else")
        // Show error and redirect
        const loadingEl = document.getElementById('loading-indicator');
        if (loadingEl) {
          loadingEl.innerHTML = '<div class="error-message">Event not found. Redirecting to events page...</div>';
        }
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 2000);
      }
    })
    .catch(error => {
      console.error("Error loading event details:", error);
      const loadingEl = document.getElementById('loading-indicator');
      if (loadingEl) {
        loadingEl.innerHTML = '<div class="error-message">Error loading event details. Please try again later.</div>';
      }
    });
}

/**
 * Populates the event details page with event data
 * @param {Object} event - Event data object
 */
function populateEventDetails(event) {
  document.title = `Event Details - ${event.title}`;
  
  // Update main event information
  const titleElement = document.querySelector('.event-header h1');
  if (titleElement) titleElement.textContent = event.title;
  
  const dateElement = document.querySelector('.meta-item:nth-child(1) span');
  if (dateElement) dateElement.textContent = formatDate(event.date);
  
  const timeElement = document.querySelector('.meta-item:nth-child(2) span');
  if (timeElement) timeElement.textContent = `${event.startTime} - ${event.endTime}`;
  
  const locationElement = document.querySelector('.meta-item:nth-child(3) span');
  if (locationElement) locationElement.textContent = event.location;
  
  const invitedElement = document.querySelector('.meta-item:nth-child(4) span');
  if (invitedElement) invitedElement.textContent = event.invited || 'Everyone can attend';
  
  const aboutSection = document.querySelector('.event-description p:nth-of-type(1)');
  if (aboutSection) aboutSection.textContent = event.description;
  
  // Handle "What to Expect" section (optional)
  const expectSection = document.querySelector('.event-description p:nth-of-type(2)');
  const expectHeader = document.querySelector('.event-description h3:nth-of-type(2)');
  if (expectSection && expectHeader) {
    if (event.expectations) {
      expectSection.textContent = event.expectations;
      expectSection.style.display = 'block';
      expectHeader.style.display = 'block';
    } else {
      expectSection.style.display = 'none';
      expectHeader.style.display = 'none';
    }
  }
  
  // Handle "Additional Information" section (optional)
  const additionalInfoSection = document.querySelector('.event-description p:nth-of-type(3)');
  const additionalInfoHeader = document.querySelector('.event-description h3:nth-of-type(3)');
  if (additionalInfoSection && additionalInfoHeader) {
    if (event.contactEmail) {
      additionalInfoSection.textContent = `Email us at ${event.contactEmail}.`;
      additionalInfoSection.style.display = 'block';
      additionalInfoHeader.style.display = 'block';
    } else {
      additionalInfoSection.style.display = 'none';
      additionalInfoHeader.style.display = 'none';
    }
  }
  
  // Handle registration button (optional)
  const registerButton = document.querySelector('.event-actions a[role="button"]:not(.secondary):not(.outline)');
  if (registerButton) {
    if (event.registrationLink) {
      registerButton.href = event.registrationLink;
      registerButton.style.display = 'flex';
    } else {
      registerButton.style.display = 'none';
    }
  }
  
  // Load comments and set up comment form
  loadEventComments(event.id);
  setupCommentForm();
}

/**
 * Loads comments for an event from the API
 * @param {string|number} eventId - ID of the event
 */
function loadEventComments(eventId) {
  const commentsSection = document.querySelector('.comments-section .comments-list');
  if (!commentsSection) return;
  
  showCommentsLoading(true);
  fetch(`${API_URL}?action=comments&id=${eventId}`)
    .then(response => {
      if (!response.ok) throw new Error('Failed to fetch comments');
      return response.json();
    })
    .then(data => {
      renderComments(data, commentsSection);
    })
    .catch(error => {
      console.error("Error loading comments:", error);
      showCommentsError("Error loading comments. Please try again later.", commentsSection);
    })
    .finally(() => {
      showCommentsLoading(false);
    });
}

/**
 * Renders comments to the DOM
 * @param {Array} comments - Array of comment objects
 * @param {HTMLElement} commentsSection - DOM element to render comments into
 */
function renderComments(comments, commentsSection) {
  commentsSection.innerHTML = '';
  
  // Show message if no comments
  if (comments.length === 0) {
    commentsSection.innerHTML = '<div class="no-comments">No comments yet. Be the first to comment!</div>';
    return;
  }
  
  // Render each comment
  comments.forEach(comment => {
    const commentElement = document.createElement('div');
    commentElement.className = 'comment';
    commentElement.innerHTML = `
      <div class="comment-author">${comment.author}</div>
      <p>${comment.content}</p>
      <div class="comment-date">Posted on ${formatDate(comment.date)}</div>
    `;
    commentsSection.appendChild(commentElement);
  });
  
  updateCommentCount();
}

/**
 * Sets up the comment form submission handler
 * Handles form submission and adds new comment to UI
 */
function setupCommentForm() {
  const commentForm = document.getElementById('comment-form');
  if (!commentForm) return;

  commentForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const commentInput = document.getElementById('comment-input');
    const commentText = commentInput.value.trim();
    
    if (!commentText) {
      alert('Please enter a comment');
      return;
    }
    
    // Create comment object
    const newComment = {
      author: 'Anonymous',
      content: commentText,
      date: new Date().toISOString()
    };
    
    // Update UI to show loading state
    const submitButton = commentForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Posting...';
    submitButton.disabled = true;
    
    // Create FormData object for API request
    const formData = new FormData(commentForm);
    
    // Add required parameters
    formData.append('action', 'comments');
    formData.append('author', 'Anonymous');
    const eventId = new URLSearchParams(window.location.search).get('id')
    formData.append('event_id', eventId);
    
    // Send POST request to API
    fetch(`${API_URL}`, {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
        alert("Error Posting Comment...");
        return;
      } else {
        // Add comment to UI and reset form
        addCommentToUI(newComment);
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
        
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.textContent = 'Comment added successfully!';
        
        const existingSuccess = commentForm.querySelector('.success-message');
        if (existingSuccess) {
          existingSuccess.remove();
        }

        commentForm.prepend(successMessage);
        
        commentInput.value = '';
        
        // Remove success message after delay
        setTimeout(() => {
          successMessage.remove();
        }, 3000);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      submitButton.textContent = originalButtonText;
      submitButton.disabled = false;
      alert("Error Posting Comment...")
    });
  });
}

/**
 * Adds a new comment to the UI without refreshing
 * @param {Object} comment - Comment object with author, content, and date
 */
function addCommentToUI(comment) {
  const commentsSection = document.querySelector('.comments-section .comments-list');
  if (!commentsSection) return;
  
  // Remove "no comments" message if present
  const noCommentsMessage = commentsSection.querySelector('.no-comments');
  if (noCommentsMessage) {
    noCommentsMessage.remove();
  }
  
  // Create and append new comment element
  const commentElement = document.createElement('div');
  commentElement.className = 'comment';
  commentElement.innerHTML = `
    <div class="comment-author">${comment.author}</div>
    <p>${comment.content}</p>
    <div class="comment-date">Posted on ${formatDate(comment.date)}</div>
  `;
  
  commentsSection.append(commentElement);
  updateCommentCount();
}

/**
 * Updates the comment count in the heading
 */
function updateCommentCount() {
  const commentsHeading = document.querySelector('.comments-section h3');
  if (!commentsHeading) return;
  
  const commentsCount = document.querySelectorAll('.comments-section .comments-list .comment').length;
  commentsHeading.textContent = `Comments (${commentsCount})`;
}

/**
 * Shows/hides loading indicator for comments
 * @param {boolean} isLoading - Whether to show or hide loading indicator
 */
function showCommentsLoading(isLoading) {
  const commentsSection = document.querySelector('.comments-section .comments-list');
  if (!commentsSection) return;
  
  const loadingIndicator = document.getElementById('comments-loading');
  
  if (isLoading) {
    if (!loadingIndicator) {
      const loadingEl = document.createElement('div');
      loadingEl.id = 'comments-loading';
      loadingEl.className = 'loading-indicator';
      loadingEl.innerHTML = '<div>Loading comments...</div>';
      
      commentsSection.innerHTML = '';
      commentsSection.appendChild(loadingEl);
    }
  } else {
    if (loadingIndicator) {
      loadingIndicator.remove();
    }
  }
}

/**
 * Shows error message for comments section
 * @param {string} message - Error message to display
 * @param {HTMLElement} commentsSection - DOM element to display error in
 */
function showCommentsError(message, commentsSection) {
  commentsSection.innerHTML = '';
  const errorEl = document.createElement('div');
  errorEl.className = 'error-message';
  errorEl.innerHTML = `<p style="color: red;">${message}</p>`;
  commentsSection.appendChild(errorEl);
}

/**
 * Sets up form validation for create/edit event form
 * Handles form submission and validation
 */
function setupFormValidation() {
  const form = document.getElementById('create-event-form');
  if (!form) return;
  
  // Check if we're in edit mode by parsing URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action');
  const eventId = urlParams.get('id');
  const isEditMode = (action === 'edit' && eventId);
  
  // Setup edit mode if needed
  if (isEditMode) {
    setupEditMode(eventId);
  }
  
  // Set up validation for all form fields
  const allFormFields = form.querySelectorAll('input, select, textarea');
  const formMessages = document.getElementById('form-messages');
  
  // Add blur event listeners for real-time validation
  allFormFields.forEach(field => {
    field.addEventListener('blur', function() {
      validateInput(this);
    });
  });
  
  // Special validation for time fields
  const startTimeInput = document.getElementById('startTime');
  const endTimeInput = document.getElementById('endTime');
  if (startTimeInput && endTimeInput) {
    endTimeInput.addEventListener('blur', function() {
      if (startTimeInput.value && endTimeInput.value) {
        if (endTimeInput.value <= startTimeInput.value) {
          showInputError(endTimeInput, 'End time must be after start time');
        } else {
          clearInputError(endTimeInput);
        }
      }
    });
  }
  
  // Form submission handler
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    let isValid = true;
    
    // Validate all fields
    allFormFields.forEach(field => {
      if (!validateInput(field)) {
        isValid = false;
      }
    });
    
    // Special validation for time fields
    if (startTimeInput && endTimeInput && startTimeInput.value && endTimeInput.value) {
      if (endTimeInput.value <= startTimeInput.value) {
        showInputError(endTimeInput, 'End time must be after start time');
        isValid = false;
      }
    }
    
    if (isValid) {
      // Show loading state
      const submitButton = form.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;
      
      // Different loading text based on mode
      submitButton.textContent = isEditMode ? 'Updating...' : 'Creating...';
      submitButton.disabled = true;
      
      if (isEditMode) {
        // For edit mode - use PUT request
        const formObject = {};
        
        // Get all form fields and add to our object
        allFormFields.forEach(field => {
          if (field.name) {
            formObject[field.name] = field.value;
          }
        });
        formObject["id"] = eventId;
        
        // Send PUT request to update event
        fetch(`${API_URL}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams(formObject).toString()
        })
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            // Show error message
            formMessages.innerHTML = `<div class="error-message">${data.error}</div>`;
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
          } else {
            // Show success message and redirect
            formMessages.innerHTML = '<div class="success-message">Event updated successfully! Redirecting to event details...</div>';
            
            setTimeout(() => {
              window.location.href = `details.html?id=${eventId}`;
            }, 2000);
          }
        })
        .catch(error => {
          console.error('Error:', error);
          formMessages.innerHTML = '<div class="error-message">An error occurred. Please try again.</div>';
          submitButton.textContent = originalButtonText;
          submitButton.disabled = false;
        });
      } else {
        // For create mode - use FormData with POST request
        const formData = new FormData(form);
        formData.append('action', 'events');
        
        fetch(`${API_URL}`, {
          method: 'POST',
          body: formData
        })
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            // Show error message
            formMessages.innerHTML = `<div class="error-message">${data.error}</div>`;
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
          } else {
            // Show success message and redirect
            formMessages.innerHTML = '<div class="success-message">Event created successfully! Redirecting to events page...</div>';
            
            setTimeout(() => {
              window.location.href = 'index.html';
            }, 2000);
          }
        })
        .catch(error => {
          console.error('Error:', error);
          formMessages.innerHTML = '<div class="error-message">An error occurred. Please try again.</div>';
          submitButton.textContent = originalButtonText;
          submitButton.disabled = false;
        });
      }
    } else {
      formMessages.innerHTML = '<div class="error-message">Please fix all form errors before submitting.</div>';
    }
  });
}

/**
 * Sets up edit mode for event form
 * Updates UI elements and loads event data
 * @param {string|number} eventId - ID of event to edit
 */
function setupEditMode(eventId) {
  // Update page title and header
  document.title = 'Edit Event';
  document.querySelector('h1').textContent = 'Edit Event';
  document.getElementById('form-description').textContent = 'Update the event details below';
  
  // Update button text
  document.querySelector('button[type="submit"]').textContent = 'Update Event';
  
  // Load event data
  loadEventData(eventId);
}

/**
 * Loads event data for editing
 * @param {string|number} eventId - ID of event to load
 */
function loadEventData(eventId) {
  const form = document.getElementById('create-event-form');
  if (!form) return;
  
  // Show loading state
  form.classList.add('loading');
  const loadingIndicator = document.createElement('div');
  loadingIndicator.id = 'form-loading';
  loadingIndicator.className = 'loading-indicator';
  loadingIndicator.innerHTML = '<div>Loading event data...</div>';
  form.appendChild(loadingIndicator);
  
  // Disable all form fields while loading
  const formElements = form.querySelectorAll('input, select, textarea, button');
  formElements.forEach(el => el.disabled = true);
  
  // Fetch event data from API
  fetch(`${API_URL}?action=events&id=${eventId}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to load event data');
      }
      return response.json();
    })
    .then(event => {
      if (event.error) {
        showFormError('Event not found or could not be loaded');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 3000);
        return;
      }
      
      // Populate form fields with event data
      document.getElementById('title').value = event.title || '';
      document.getElementById('category').value = event.category.toLowerCase() || '';
      document.getElementById('date').value = event.date || '';
      document.getElementById('startTime').value = event.startTime || '';
      document.getElementById('endTime').value = event.endTime || '';
      document.getElementById('location').value = event.location || '';
      document.getElementById('invited').value = event.invited || '';
      document.getElementById('description').value = event.description || '';
      document.getElementById('expectations').value = event.expectations || '';
      document.getElementById('contactEmail').value = event.contactEmail || '';
      document.getElementById('registrationLink').value = event.registrationLink || '';
    })
    .catch(error => {
      console.error('Error loading event:', error);
      showFormError('Failed to load event data. Please try again.');
    })
    .finally(() => {
      // Remove loading indicator
      const loadingEl = document.getElementById('form-loading');
      if (loadingEl) {
        loadingEl.remove();
      }
      
      // Re-enable form elements
      formElements.forEach(el => el.disabled = false);
      form.classList.remove('loading');
    });
}

/**
 * Shows form error message
 * @param {string} message - Error message to display
 */
function showFormError(message) {
  const formMessages = document.getElementById('form-messages');
  if (formMessages) {
    formMessages.innerHTML = `<div class="error-message">${message}</div>`;
  }
}
/**
 * Validates an individual form field
 * @param {HTMLElement} field - The form field to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateInput(field) {
  // Check required fields
  if (field.hasAttribute('required') && !field.value.trim()) {
    showInputError(field, 'This field is required');
    return false;
  }
  
  // Special validation for select elements
  if (field.tagName === 'SELECT' && field.hasAttribute('required')) {
    if (field.selectedIndex === 0 && field.options[0].disabled) {
      showInputError(field, 'This field is required');
      return false;
    }
  }
  
  // Email validation
  if (field.type === 'email' && field.value.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(field.value.trim())) {
      showInputError(field, 'Please enter a valid email address');
      return false;
    }
  }
  // URL validation
  if (field.type === 'url' && field.value.trim()) {
    try {
      new URL(field.value.trim());
    } catch (e) {
      showInputError(field, 'Please enter a valid URL');
      return false;
    }
  }
  // If we got here, the field is valid
  clearInputError(field);
  return true;
}

/**
 * Shows validation error message for a form field
 * @param {HTMLElement} field - The form field with error
 * @param {string} message - Error message to display
 */
function showInputError(field, message) {
  // Clear any existing errors first
  clearInputError(field);
  // Add error styling and message
  field.classList.add('is-invalid');
  const errorMessage = document.createElement('small');
  errorMessage.className = 'error-message';
  errorMessage.textContent = message;
  field.parentNode.insertBefore(errorMessage, field.nextSibling);
}

/**
 * Removes validation error styling and message from a form field
 * @param {HTMLElement} field - The form field to clear errors from
 */
function clearInputError(field) {
  field.classList.remove('is-invalid');
  const existingError = field.parentNode.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }
}

/**
 * Sets up event handlers for the delete and edit buttons on event detail page
 */
function setupDeleteButton() {
  const deleteButton = document.querySelector('.event-actions a[role="button"].outline.red');
  if (!deleteButton) return;
  // Add click handler for delete button
  deleteButton.addEventListener('click', function(e) {
    e.preventDefault();
    const eventId = new URLSearchParams(window.location.search).get('id');
    // Confirm deletion with user
    if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      // Update UI to show deletion in progress
      deleteButton.textContent = 'Deleting...';
      deleteButton.disabled = true;
      deleteButton.style.opacity = '0.7';
      
      // Send DELETE request to API
      fetch(`${API_URL}?id=${eventId}`, {
        method: 'DELETE'
      })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          // Show error if deletion failed
          alert(`Error: ${data.error}`);
          deleteButton.textContent = 'Delete Event';
          deleteButton.disabled = false;
          deleteButton.style.opacity = '';
        } else {
          // Redirect to events list on success
          alert('Event deleted successfully!');
          window.location.href = 'index.html';
        }
      })
      .catch(error => {
        // Handle network errors
        console.error('Error:', error);
        alert('An error occurred while deleting the event. Please try again.');
        deleteButton.textContent = 'Delete Event';
        deleteButton.disabled = false;
        deleteButton.style.opacity = '';
      });
    }
  });
  // Set up edit button link
  const editButton = document.querySelector('.event-actions a[role="button"].outline');
  if (!editButton) return;
  const eventId = new URLSearchParams(window.location.search).get('id');
  editButton.href = "create.html?action=edit&id=" + eventId;
}

/**
 * Main initialization function that runs on page load
 * Sets up event handlers based on current page
 */
document.addEventListener('DOMContentLoaded', function() {
  const currentPath = window.location.pathname;
  // Index page - events listing
  if (currentPath.includes('index.html') || currentPath.endsWith('/')) {
    // Initially disable controls until data is loaded
    enableControls(false);
    fetchEvents();
    
    // Set up filter and sort event handlers
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        applyFilters();
        renderEvents();
        setupPagination();
      });
    }
    
    if (categorySelect) {
      categorySelect.addEventListener('change', function() {
        applyFilters();
        renderEvents();
        setupPagination();
      });
    }
    
    if (dateRangeSelect) {
      dateRangeSelect.addEventListener('change', function() {
        applyFilters();
        renderEvents();
        setupPagination();
      });
    }
    
    if (sortSelect) {
      sortSelect.addEventListener('change', function() {
        applyFilters();
        renderEvents();
        setupPagination();
      });
    }
  } 
  // Event details page
  else if (currentPath.includes('details.html')) {
    loadEventDetails();
  } 
  // Event creation/edit page
  else if (currentPath.includes('create.html')) {
    setupFormValidation();
  }
});
