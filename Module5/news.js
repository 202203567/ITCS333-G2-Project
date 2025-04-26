// news.js

// Elements
const newsListElement = document.querySelector('.events-list');
const searchInput = document.getElementById('search');
const categorySelect = document.getElementById('category');
const dateRangeSelect = document.getElementById('date-range');
const sortSelect = document.getElementById('sort');

let newsData = [];
let currentPage = 1;
const itemsPerPage = 2; // 2 news per page for demo

// Fetch news from local JSON file
async function fetchNews() {
  try {
    showLoading();
    const response = await fetch('news-data.json');
    if (!response.ok) {
      throw new Error('Failed to fetch news.');
    }
    const data = await response.json();
    newsData = data;
    renderNews();
  } catch (error) {
    showError(error.message);
  } finally {
    hideLoading();
  }
}

// Render news
function renderNews() {
  const filteredNews = applyFilters(newsData);
  const sortedNews = applySorting(filteredNews);
  const paginatedNews = paginate(sortedNews, currentPage);

  newsListElement.innerHTML = '';

  if (paginatedNews.length === 0) {
    newsListElement.innerHTML = '<p>No news found.</p>';
    return;
  }

  paginatedNews.forEach(news => {
    const article = document.createElement('article');
    article.className = 'event-card';
    article.innerHTML = `
      <div class="event-date">${formatDate(news.date)}</div>
      <h3>${news.title}</h3>
      <p>${news.description.substring(0, 100)}...</p>
      <div>
        <a href="details.html?id=${news.id}">View Details</a>
      </div>
    `;
    newsListElement.appendChild(article);
  });

  renderPagination(filteredNews.length);
}

// Apply search + filter
function applyFilters(newsList) {
  const searchText = searchInput.value.toLowerCase();
  const selectedCategory = categorySelect.value;
  const selectedDateRange = dateRangeSelect.value;
  const now = new Date();

  return newsList.filter(news => {
    const matchesSearch = news.title.toLowerCase().includes(searchText) || news.description.toLowerCase().includes(searchText);
    const matchesCategory = selectedCategory ? news.category === selectedCategory : true;
    const matchesDateRange = (() => {
      if (selectedDateRange === '24hours') {
        const diff = (now - new Date(news.date)) / (1000 * 60 * 60);
        return diff <= 24;
      } else if (selectedDateRange === 'week') {
        const diff = (now - new Date(news.date)) / (1000 * 60 * 60 * 24);
        return diff <= 7;
      } else if (selectedDateRange === 'month') {
        const diff = (now - new Date(news.date)) / (1000 * 60 * 60 * 24);
        return diff <= 30;
      }
      return true;
    })();

    return matchesSearch && matchesCategory && matchesDateRange;
  });
}

// Apply sorting
function applySorting(newsList) {
  const sortOrder = sortSelect.value;
  return [...newsList].sort((a, b) => {
    if (sortOrder === 'asc') {
      return new Date(a.date) - new Date(b.date);
    } else {
      return new Date(b.date) - new Date(a.date);
    }
  });
}

// Paginate news
function paginate(newsList, page) {
  const start = (page - 1) * itemsPerPage;
  return newsList.slice(start, start + itemsPerPage);
}

// Format date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

// Show loading
function showLoading() {
  newsListElement.innerHTML = '<p>Loading...</p>';
}

// Hide loading (optional)
function hideLoading() {
  // No special action needed because renderNews() will overwrite
}

// Show error
function showError(message) {
  newsListElement.innerHTML = `<p style="color:red;">${message}</p>`;
}

// Render pagination buttons
function renderPagination(totalItems) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginationElement = document.querySelector('.pagination ul');

  paginationElement.innerHTML = '';

  if (totalPages <= 1) return;

  const prevPage = `<li><a href="#" data-page="${currentPage - 1}">&lt;</a></li>`;
  paginationElement.innerHTML += prevPage;

  for (let i = 1; i <= totalPages; i++) {
    paginationElement.innerHTML += `
      <li><a href="#" data-page="${i}" ${i === currentPage ? 'aria-current="page"' : ''}>${i}</a></li>
    `;
  }

  const nextPage = `<li><a href="#" data-page="${currentPage + 1}">&gt;</a></li>`;
  paginationElement.innerHTML += nextPage;

  // Event listener for pagination links
  document.querySelectorAll('.pagination a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = Number(link.dataset.page);
      if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderNews();
      }
    });
  });
}

// Event listeners
searchInput.addEventListener('input', () => {
  currentPage = 1;
  renderNews();
});
categorySelect.addEventListener('change', () => {
  currentPage = 1;
  renderNews();
});
dateRangeSelect.addEventListener('change', () => {
  currentPage = 1;
  renderNews();
});
sortSelect.addEventListener('change', () => {
  currentPage = 1;
  renderNews();
});

// Start
fetchNews();
