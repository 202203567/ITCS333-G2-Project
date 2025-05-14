# Campus Club Hub API Documentation

## Overview

The Campus Club Hub API provides access to campus activities, clubs, and related data. It allows clients to retrieve, create, update, and delete activities, as well as manage comments and registrations.

## Base URL

All API requests should be made to:

```
/activities-api.php
```

## Authentication

The API currently does not require authentication.

## Response Format

All responses are in JSON format. Successful responses include a `status` field with value `"success"`, while error responses have a `status` field with value `"error"` and a `message` field describing the error.

## Endpoints

### Activities

#### Get Activities

Retrieves a paginated list of activities with optional filtering and sorting.

- **URL**: `/activities-api.php?route=activities`
- **Method**: `GET`
- **Parameters**:
  - `page` (optional): Page number for pagination (default: 1)
  - `limit` (optional): Number of items per page (default: 6)
  - `search` (optional): Search term for filtering activities by title or description
  - `category` (optional): Filter activities by category name
  - `sort` (optional): Sort order for results (options: `newest`, `oldest`, `name-asc`, `name-desc`, default: `newest`)

- **Success Response**:
  ```json
  {
    "status": "success",
    "total": 20,
    "page": 1,
    "total_pages": 4,
    "activities": [
      {
        "id": 1,
        "title": "Chess Club Tournament",
        "description": "Join us for our weekly chess tournament!...",
        "date": "2025-04-15",
        "time": "18:00:00",
        "location": "Student Union Building, Room 302",
        "club_id": 1,
        "capacity": 32,
        "registrations": 18,
        "contact": "chess@campus.edu",
        "created_at": "2025-01-01 12:00:00",
        "club_name": "Chess Club",
        "categories": ["Academic", "Competition"]
      },
      // More activities...
    ]
  }
  ```

#### Get Activity by ID

Retrieves detailed information about a specific activity.

- **URL**: `/activities-api.php?route=activity&id={id}`
- **Method**: `GET`
- **Parameters**:
  - `id` (required): The ID of the activity to retrieve

- **Success Response**:
  ```json
  {
    "status": "success",
    "activity": {
      "id": 1,
      "title": "Chess Club Tournament",
      "description": "Join us for our weekly chess tournament!...",
      "date": "2025-04-15",
      "time": "18:00:00",
      "location": "Student Union Building, Room 302",
      "club_id": 1,
      "capacity": 32,
      "registrations": 18,
      "contact": "chess@campus.edu",
      "created_at": "2025-01-01 12:00:00",
      "club_name": "Chess Club",
      "categories": ["Academic", "Competition"]
    }
  }
  ```

- **Error Response** (Activity not found):
  ```json
  {
    "status": "error",
    "message": "Activity not found"
  }
  ```

#### Create Activity

Creates a new activity.

- **URL**: `/activities-api.php?route=activities`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "title": "New Chess Tournament",
    "date": "2025-05-01",
    "time": "18:00:00",
    "location": "Student Union Building, Room 302",
    "club_id": 1,
    "description": "Join us for our chess tournament!",
    "capacity": 32,
    "contact": "chess@campus.edu",
    "categories": [1, 6]
  }
  ```
  - Required fields: `title`, `date`, `time`, `location`, `club_id`, `description`, `contact`, `categories`
  - Optional fields: `capacity` (default: 0, which means unlimited)

- **Success Response**:
  ```json
  {
    "status": "success",
    "message": "Activity created successfully",
    "activity_id": 7
  }
  ```

- **Error Response** (Missing fields):
  ```json
  {
    "status": "error",
    "message": "Missing required field: title"
  }
  ```

#### Update Activity

Updates an existing activity.

- **URL**: `/activities-api.php?route=activities&id={id}`
- **Method**: `PUT`
- **Content-Type**: `application/json`
- **Parameters**:
  - `id` (required): The ID of the activity to update
- **Request Body**: Same as for Create Activity

- **Success Response**:
  ```json
  {
    "status": "success",
    "message": "Activity updated successfully"
  }
  ```

- **Error Response**:
  ```json
  {
    "status": "error",
    "message": "Failed to update activity"
  }
  ```

#### Delete Activity

Deletes an activity.

- **URL**: `/activities-api.php?route=activities&id={id}`
- **Method**: `DELETE`
- **Parameters**:
  - `id` (required): The ID of the activity to delete

- **Success Response**:
  ```json
  {
    "status": "success",
    "message": "Activity deleted successfully"
  }
  ```

- **Error Response**:
  ```json
  {
    "status": "error",
    "message": "Failed to delete activity"
  }
  ```

### Clubs

#### Get Clubs

Retrieves all clubs.

- **URL**: `/activities-api.php?route=clubs`
- **Method**: `GET`

- **Success Response**:
  ```json
  {
    "status": "success",
    "clubs": [
      {
        "id": 1,
        "name": "Chess Club",
        "description": "A club for chess enthusiasts of all skill levels.",
        "created_at": "2025-01-01 12:00:00"
      },
      // More clubs...
    ]
  }
  ```

### Comments

#### Get Comments by Activity ID

Retrieves all comments for a specific activity.

- **URL**: `/activities-api.php?route=comments&activity_id={id}`
- **Method**: `GET`
- **Parameters**:
  - `activity_id` (required): The ID of the activity to get comments for

- **Success Response**:
  ```json
  {
    "status": "success",
    "comments": [
      {
        "id": 1,
        "activity_id": 1,
        "author": "Alex Johnson",
        "text": "Will beginners be paired against more experienced players?...",
        "created_at": "2025-04-10 15:30:00"
      },
      // More comments...
    ]
  }
  ```

#### Add Comment

Adds a new comment to an activity.

- **URL**: `/activities-api.php?route=comments`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "activity_id": 1,
    "author": "Jane Smith",
    "text": "Looking forward to this event!"
  }
  ```
  - Required fields: `activity_id`, `author`, `text`

- **Success Response**:
  ```json
  {
    "status": "success",
    "message": "Comment added successfully",
    "comment_id": 4
  }
  ```

- **Error Response**:
  ```json
  {
    "status": "error",
    "message": "Comment text cannot be empty"
  }
  ```

### Registration

#### Register for Activity

Registers a user for an activity.

- **URL**: `/activities-api.php?route=register`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "activity_id": 1,
    "user_name": "John Doe"
  }
  ```
  - Required fields: `activity_id`, `user_name`

- **Success Response**:
  ```json
  {
    "status": "success",
    "message": "Registration successful"
  }
  ```

- **Error Response** (Activity full):
  ```json
  {
    "status": "error",
    "message": "Registration failed. The activity may be full."
  }
  ```

## Error Handling

All API endpoints return appropriate HTTP status codes:
- `200 OK`: The request was successful
- `400 Bad Request`: The request was invalid or cannot be fulfilled
- `405 Method Not Allowed`: The HTTP method is not supported for the requested endpoint

Error responses include a descriptive message to help identify the issue:

```json
{
  "status": "error",
  "message": "Error message description"
}
```

## CORS Support

The API supports Cross-Origin Resource Sharing (CORS) and allows requests from any origin. Preflight requests (`OPTIONS`) are handled appropriately.

## Database Schema

The API interacts with the following database tables:
- `activities`: Stores activity information
- `clubs`: Stores information about campus clubs
- `categories`: Contains activity categories
- `activity_categories`: Links activities to categories (many-to-many)
- `comments`: Stores comments on activities
- `registrations`: Tracks user registrations for activities
