
## Overview
This API provides endpoints for managing course notes, comments, and categories. It supports CRUD (Create, Read, Update, Delete) operations for notes and comments.

## Base URL
https://9410da3b-706d-4938-82cd-9c5990694d4e-00-1p2t0tp1gdlq2.pike.replit.dev/course-notes/API.php

## Authentication
Currently, the API does not require authentication. However, security headers are implemented to prevent common web vulnerabilities.

## Endpoints

### Notes Endpoints

#### 1. Get All Notes
- **Endpoint:** `?action=notes`
- **Method:** `GET`
- **Query Parameters:**
  - `category` (optional): Filter notes by category
  - `search` (optional): Search term for filtering notes
  - `page` (optional, default: 1): Page number for pagination
  - `per_page` (optional, default: 3, max: 50): Number of notes per page
  - `sort` (optional, default: 'date-desc'): Sorting options
    - `title`: Sort by title (ascending)
    - `date-asc`: Sort by date (ascending)
    - `date-desc`: Sort by date (descending)

- **Response:**
  ```json
  {
    "data": [
      {
        "id": 1,
        "title": "Note Title",
        "content": "Note Content",
        "category": "CS",
        "created_at": "May 10, 2025",
        "updated_at": "May 12, 2025",
        "comment_count": 3
      }
    ],
    "pagination": {
      "total": 15,
      "per_page": 3,
      "current_page": 1,
      "last_page": 5
    }
  }
  ```

#### 2. Get Specific Note
- **Endpoint:** `?action=notes&id={noteId}`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "data": {
      "id": 1,
      "title": "Note Title",
      "content": "Note Content",
      "category": "CS",
      "created_at": "May 10, 2025",
      "updated_at": "May 12, 2025",
      "comment_count": 3
    }
  }
  ```

#### 3. Create a Note
- **Endpoint:** `?action=notes`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "title": "New Note Title",
    "content": "Note content goes here",
    "category": "CS"
  }
  ```
- **Response:** Created note details (201 Created)

#### 4. Update a Note
- **Endpoint:** `?action=notes&id={noteId}`
- **Method:** `PUT`
- **Request Body:**
  ```json
  {
    "title": "Updated Note Title",
    "content": "Updated note content",
    "category": "IS"
  }
  ```
- **Response:** Updated note details (200 OK)

#### 5. Delete a Note
- **Endpoint:** `?action=notes&id={noteId}`
- **Method:** `DELETE`
- **Response:** Success message (200 OK)

### Comments Endpoints

#### 1. Get Comments for a Note
- **Endpoint:** `?action=comments&note_id={noteId}`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "data": [
      {
        "id": 1,
        "note_id": 1,
        "text": "Great note!",
        "author": "Student",
        "created_at": "May 12, 2025"
      }
    ]
  }
  ```

#### 2. Create a Comment
- **Endpoint:** `?action=comments&note_id={noteId}`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "text": "Helpful comment",
    "author": "Student Name"
  }
  ```
- **Response:** Created comment details (201 Created)

#### 3. Update a Comment
- **Endpoint:** `?action=comments&id={commentId}`
- **Method:** `PUT`
- **Request Body:**
  ```json
  {
    "text": "Updated comment text"
  }
  ```
- **Response:** Updated comment details (200 OK)

#### 4. Delete a Comment
- **Endpoint:** `?action=comments&id={commentId}`
- **Method:** `DELETE`
- **Response:** Success message (200 OK)

### Categories Endpoint

#### 1. Get All Categories
- **Endpoint:** `?action=categories`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "data": ["CS", "IS", "IT", "CE", "MATHS"]
  }
  ```

## Error Handling
- All error responses include an `error` key with a descriptive message
- Common HTTP status codes:
  - 200: Successful request
  - 201: Resource created
  - 400: Bad request (invalid input)
  - 404: Resource not found
  - 500: Server error

## Validation Rules
- Note Title: 3-255 characters
- Note Content: 10-65535 characters
- Category: Must be from predefined list
- Comment Text: 1-1000 characters
- Comment Author: 2-100 characters

## Security Features
- CORS headers
- Input sanitization
- XSS protection
- Strict transport security
- Prepared statements to prevent SQL injection
