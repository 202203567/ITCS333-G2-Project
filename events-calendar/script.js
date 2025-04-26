const eventsList = document.querySelector('.events-list');
const searchInput = document.getElementById('search');
const categorySelect = document.getElementById('category');
const dateRangeSelect = document.getElementById('date-range');
const sortSelect = document.getElementById('sort');
const paginationElement = document.querySelector('.pagination ul');
const eventsDataPath = "events.json";
const eventsPerPage = 4;

let events = [];
let filteredEvents = [];
let currentPage = 1;

async function fetchEvents() {
  showLoading(true);
  try {
    const response = await fetch(eventsDataPath);
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
    showError("Failed to load events. Please make sure events.json exists and is properly formatted.");
    enableControls(false);
  } finally {
    showLoading(false);
  }
}

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

function showError(message) {
  const errorEl = document.createElement('div');
  errorEl.className = 'error-message';
  errorEl.innerHTML = `<p>${message}</p>`;
  if (eventsList) {
    eventsList.innerHTML = '';
    eventsList.appendChild(errorEl);
  }else{
    document.getElementsByTagName('body')[0].innerHTML = '';
    document.getElementsByTagName('body')[0].appendChild(errorEl);
  }
}

function enableControls(enable) {
  const controls = [
    searchInput,
    categorySelect,
    dateRangeSelect,
    sortSelect,
    document.querySelector('.controls a[role="button"]')
  ];
  controls.forEach(control => {
    if (control) {
      control.disabled = !enable;
      
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

function applyFilters() {
  const searchTerm = searchInput?.value.toLowerCase() || '';
  const category = categorySelect?.value || '';
  const dateRange = dateRangeSelect?.value || 'year';
  const sortOrder = sortSelect?.value || 'asc';
  filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm) || event.description.toLowerCase().includes(searchTerm);
    const matchesCategory = category === '' || event.category.toLowerCase() === category.toLowerCase();
    const matchesDate = isInDateRange(event.date, dateRange);
    return matchesSearch && matchesCategory && matchesDate;
  });
  filteredEvents.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });
  currentPage = 1;
}

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
      return eventDate.getMonth() === today.getMonth() && eventDate.getFullYear() === today.getFullYear();
    case 'year': 
    default:
      return eventDate.getFullYear() === today.getFullYear();
  }
}

function renderEvents() {
  if (!eventsList) return;
  eventsList.innerHTML = '';
  const startIndex = (currentPage - 1) * eventsPerPage;
  const endIndex = startIndex + eventsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, endIndex);
  if (paginatedEvents.length === 0) {
    eventsList.innerHTML = '<div class="no-events">No events found matching your criteria.</div>';
    return;
  }
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

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function setupPagination() {
  if (!paginationElement) return;
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
  paginationElement.innerHTML = '';
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

function loadEventDetails() {
  if (!document.querySelector('.event-header')) return;
  const eventId = new URLSearchParams(window.location.search).get('id')
  if (!eventId) {
    window.location.href = 'index.html';
    return;
  }
  showLoading(true);
  fetch(eventsDataPath)
    .then(response => {
      if (!response.ok) throw new Error('Failed to fetch event details');
      return response.json();
    })
    .then(data => {
      if (!data.events || data.events.length === 0) {
        throw new Error("No events found in the data file.");
      }
      const event = data.events.find(e => e.id == eventId);
      if (event) {
        populateEventDetails(event);
        document.querySelector('article').classList.remove('loading-hidden');
        document.querySelector('footer').classList.remove('loading-hidden');
      } else {
        window.location.href = 'index.html';
      }
    })
    .catch(error => {
      console.error("Error loading event details:", error);
      showError("Error loading event details. Please make sure events.json exists and is properly formatted.");
    })
    .finally(() => {
      showLoading(false);
    });
}

function populateEventDetails(event) {
  document.title = `Event Details - ${event.title}`;
  
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
  const registerButton = document.querySelector('.event-actions a[role="button"]:not(.secondary):not(.outline)');
  if (registerButton) {
    if (event.registrationLink) {
      registerButton.href = event.registrationLink;
      registerButton.style.display = 'inline-block';
    } else {
      registerButton.style.display = 'none';
    }
  }
  loadEventComments(event.id);
  setupCommentForm();
}

function loadEventComments(eventId) {
  const commentsSection = document.querySelector('.comments-section .comments-list');
  if (!commentsSection) return;
  showCommentsLoading(true);
  fetch(eventsDataPath)
    .then(response => {
      if (!response.ok) throw new Error('Failed to fetch comments');
      return response.json();
    })
    .then(data => {
      if (!data.events || data.events.length === 0) {
        throw new Error("No events found in the data file.");
      }
      const event = data.events.find(e => e.id == eventId);
      if (event && event.comments) {
        renderComments(event.comments, commentsSection);
      } else {
        showCommentsError("No comments found for this event", commentsSection);
      }
    })
    .catch(error => {
      console.error("Error loading comments:", error);
      showCommentsError("Error loading comments. Please try again later.", commentsSection);
    })
    .finally(() => {
      showCommentsLoading(false);
    });
}

function renderComments(comments, commentsSection) {
  commentsSection.innerHTML = '';
  if (comments.length === 0) {
    commentsSection.innerHTML = '<div class="no-comments">No comments yet. Be the first to comment!</div>';
    return;
  }
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

function setupCommentForm() {
  const commentForm = document.querySelector('.comments-section form');
  if (!commentForm) return;
  
  commentForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const commentInput = document.getElementById('comment');
    const commentText = commentInput.value.trim();
    
    if (!commentText) {
      alert('Please enter a comment');
      return;
    }
    const newComment = {
      author: 'You',
      content: commentText,
      date: new Date().toISOString()
    };
    
    addCommentToUI(newComment);
    
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.textContent = 'Comment added successfully!';
    
    const existingSuccess = commentForm.querySelector('.success-message');
    if (existingSuccess) {
      existingSuccess.remove();
    }
    
    commentForm.appendChild(successMessage);
    
    commentInput.value = '';
    
    setTimeout(() => {
      successMessage.remove();
    }, 3000);
  });
}

function addCommentToUI(comment) {
  const commentsSection = document.querySelector('.comments-section .comments-list');
  if (!commentsSection) return;
  
  const noCommentsMessage = commentsSection.querySelector('.no-comments');
  if (noCommentsMessage) {
    noCommentsMessage.remove();
  }
  
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

function updateCommentCount() {
  const commentsHeading = document.querySelector('.comments-section h3');
  if (!commentsHeading) return;
  
  const commentsCount = document.querySelectorAll('.comments-section .comments-list .comment').length;
  commentsHeading.textContent = `Comments (${commentsCount})`;
}

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

function showCommentsError(message, commentsSection) {
  commentsSection.innerHTML = '';
  const errorEl = document.createElement('div');
  errorEl.className = 'error-message';
  errorEl.innerHTML = `<p>${message}</p>`;
  commentsSection.appendChild(errorEl);
}
function setupFormValidation() {
  const form = document.querySelector('form');
  if (!form) return;
  const allFormFields = form.querySelectorAll('input, select, textarea');
  allFormFields.forEach(field => {
    field.addEventListener('blur', function() {
      validateInput(this);
    });
  });
  const startTimeInput = document.getElementById('start-time');
  const endTimeInput = document.getElementById('end-time');
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
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    let isValid = true;
    allFormFields.forEach(field => {
      if (!validateInput(field)) {
        isValid = false;
      }
    });
    if (startTimeInput && endTimeInput && startTimeInput.value && endTimeInput.value) {
      if (endTimeInput.value <= startTimeInput.value) {
        showInputError(endTimeInput, 'End time must be after start time');
        isValid = false;
      }
    }
    if (isValid) {
      const successMessage = document.createElement('div');
      successMessage.className = 'success-message';
      successMessage.textContent = 'Event created successfully! Redirecting to events page...';
      form.prepend(successMessage);
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
    }
  });
}

function validateInput(field) {
  if (field.hasAttribute('required') && !field.value.trim()) {
    showInputError(field, 'This field is required');
    return false;
  }
  if (field.tagName === 'SELECT' && field.hasAttribute('required')) {
    if (field.selectedIndex === 0 && field.options[0].disabled) {
      showInputError(field, 'This field is required');
      return false;
    }
  }
  if (field.type === 'email' && field.value.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(field.value.trim())) {
      showInputError(field, 'Please enter a valid email address');
      return false;
    }
  }
  if (field.type === 'url' && field.value.trim()) {
    try {
      new URL(field.value.trim());
    } catch (e) {
      showInputError(field, 'Please enter a valid URL');
      return false;
    }
  }
  clearInputError(field);
  return true;
}

function showInputError(field, message) {
  clearInputError(field);
  field.classList.add('is-invalid');
  const errorMessage = document.createElement('small');
  errorMessage.className = 'error-message';
  errorMessage.textContent = message;
  field.parentNode.insertBefore(errorMessage, field.nextSibling);
}

function clearInputError(field) {
  field.classList.remove('is-invalid');
  const existingError = field.parentNode.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const currentPath = window.location.pathname;
  if (currentPath.includes('index.html') || currentPath.endsWith('/')) {
    enableControls(false);
    fetchEvents();
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
  } else if (currentPath.includes('details.html')) {
    loadEventDetails();
  } else if (currentPath.includes('create.html')) {
    setupFormValidation();
  }
});
