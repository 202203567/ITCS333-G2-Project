<p align="center">https://replit.com/@malthawadi/g2-events-calendar</center></p>

# Event Management API Documentation

This document outlines all available endpoints for the Event Management API.

## Base URL

All endpoints are relative to the base URL where the API is hosted.

## Endpoints

### 1. Get All Events

Retrieves a list of all events, with optional pagination.

**Request**
- **Method:** GET
- **Endpoint:** `/?action=events`
- **Parameters:**
  - `page` (optional): The page number to retrieve (integer, starts at 1)
  - `limit` (optional): The number of events per page (integer)

**Response**
- **Status Code:** 200 OK
- **Body:**
```json
{
  "events": [
    {
      "id": 1,
      "title": "Event Title",
      "date": "2025-05-10",
      "startTime": "10:00:00",
      "endTime": "12:00:00",
      "location": "Location",
      "category": "Category",
      "description": "Description",
      "expectations": "Expectations",
      "invited": "Invited",
      "contactEmail": "email@example.com",
      "registrationLink": "https://example.com",
      "created_at": "2025-05-10 12:00:00"
    },
    // ... more events
  ],
  "pagination": {  // Only included when page and limit parameters are provided
    "currentPage": 1,
    "itemsPerPage": 10,
    "totalItems": 25,
    "totalPages": 3
  }
}
```

### 2. Get Single Event

Retrieves details for a specific event by ID.

**Request**
- **Method:** GET
- **Endpoint:** `/?action=events&id={event_id}`
- **Parameters:**
  - `id`: The ID of the event to retrieve (integer, required)

**Response**
- **Status Code:** 200 OK
- **Body:**
```json
{
  "id": 1,
  "title": "Event Title",
  "date": "2025-05-10",
  "startTime": "10:00:00",
  "endTime": "12:00:00",
  "location": "Location",
  "category": "Category",
  "description": "Description",
  "expectations": "Expectations",
  "invited": "Invited",
  "contactEmail": "email@example.com",
  "registrationLink": "https://example.com",
  "created_at": "2025-05-10 12:00:00"
}
```

- **Status Code:** 404 Not Found
- **Body:**
```json
{
  "error": "Event not found"
}
```

### 3. Create New Event

Creates a new event with the provided information.

**Request**
- **Method:** POST
- **Endpoint:** `/`
- **Parameters:** 
  - `action`: Must be set to "events" (string, required)
  - `title`: Event title (string, required)
  - `date`: Event date in YYYY-MM-DD format (string, required)
  - `startTime`: Event start time (string, required)
  - `endTime`: Event end time (string, required)
  - `location`: Event location (string, required)
  - `category`: Event category (string, required)
  - `description`: Event description (string, required)
  - `invited`: Who is invited (string, required)
  - `expectations`: Event expectations (string, optional)
  - `contactEmail`: Contact email (string, optional, must be valid email)
  - `registrationLink`: Registration link (string, optional, must be valid URL)

**Response**
- **Status Code:** 201 Created
- **Body:**
```json
{
  "message": "Event created successfully"
}
```

- **Status Code:** 400 Bad Request
- **Body:**
```json
{
  "error": "Missing required fields"
}
```
or
```json
{
  "error": "Failed to create event. Please check your input data."
}
```

### 4. Update Event

Updates an existing event with the provided information.

**Request**
- **Method:** PUT
- **Endpoint:** `/`
- **Parameters:**
  - `id`: Event ID to update (integer, required)
  - `title`: Event title (string, required)
  - `date`: Event date in YYYY-MM-DD format (string, required)
  - `startTime`: Event start time (string, required)
  - `endTime`: Event end time (string, required)
  - `location`: Event location (string, required)
  - `category`: Event category (string, required)
  - `description`: Event description (string, required)
  - `invited`: Who is invited (string, required)
  - `expectations`: Event expectations (string, optional)
  - `contactEmail`: Contact email (string, optional, must be valid email)
  - `registrationLink`: Registration link (string, optional, must be valid URL)

**Response**
- **Status Code:** 200 OK
- **Body:**
```json
{
  "message": "Event updated"
}
```

- **Status Code:** 400 Bad Request
- **Body:**
```json
{
  "error": "Missing or invalid required fields"
}
```
or
```json
{
  "error": "Failed to update event or event not found"
}
```

### 5. Delete Event

Deletes an event by ID.

**Request**
- **Method:** DELETE
- **Endpoint:** `/?id={event_id}`
- **Parameters:**
  - `id`: ID of the event to delete (integer, required)

**Response**
- **Status Code:** 200 OK
- **Body:**
```json
{
  "message": "Event deleted"
}
```

- **Status Code:** 400 Bad Request
- **Body:**
```json
{
  "error": "Missing or invalid ID"
}
```
or
```json
{
  "error": "Failed to delete event or event not found"
}
```

### 6. Get Comments for Event

Retrieves all comments for a specific event.

**Request**
- **Method:** GET
- **Endpoint:** `/?action=comments&id={event_id}`
- **Parameters:**
  - `id`: ID of the event to get comments for (integer, required)

**Response**
- **Status Code:** 200 OK
- **Body:**
```json
[
  {
    "id": 1,
    "event_id": 1,
    "author": "Comment Author",
    "content": "Comment content",
    "date": "2025-05-10 12:00:00"
  },
  // ... more comments
]
```

- **Status Code:** 400 Bad Request
- **Body:**
```json
{
  "error": "Missing or invalid event ID"
}
```

### 7. Add Comment to Event

Adds a new comment to an event.

**Request**
- **Method:** POST
- **Endpoint:** `/`
- **Parameters:**
  - `action`: Must be set to "comments" (string, required)
  - `event_id`: ID of the event to add comment to (integer, required)
  - `author`: Name of comment author (string, required, max 100 chars)
  - `content`: Comment content (string, required, max 2000 chars)

**Response**
- **Status Code:** 201 Created
- **Body:**
```json
{
  "message": "Comment added"
}
```

- **Status Code:** 400 Bad Request
- **Body:**
```json
{
  "error": "Missing or invalid required fields"
}
```
or
```json
{
  "error": "Failed to add comment"
}
```

## Error Responses

All endpoints may also return the following error responses:

- **Status Code:** 404 Not Found
- **Body:**
```json
{
  "error": "Invalid Endpoint"
}
```

- **Status Code:** 405 Method Not Allowed
- **Body:**
```json
{
  "error": "Invalid HTTP method"
}
```

- **Status Code:** 500 Internal Server Error
- **Body:**
```json
{
  "error": "Error message describing the issue"
}
```
