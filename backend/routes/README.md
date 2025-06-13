# Document Management API Endpoints

This document describes the available endpoints for document management in the TrueID system.

## Base URL
```
/api/documents
```

## Authentication
All endpoints require authentication using JWT tokens:
- User endpoints require `authMiddleware`
- Admin endpoints require `adminAuthMiddleware`

Include the token in the Authorization header:
```
Authorization: Bearer <your_token>
```

## Endpoints

### Upload Document
Upload a new document, optionally linking it to a professional record.

```http
POST /upload
```

#### Request
- Method: `POST`
- Content-Type: `multipart/form-data`
- Authentication: Required (User)

##### Parameters
| Name | Type | Required | Description |
|------|------|----------|-------------|
| document | File | Yes | Document file to upload |
| professionalRecordId | Integer | No | ID of the professional record to link |

##### Supported File Types
- PDF (application/pdf)
- DOC (application/msword)
- DOCX (application/vnd.openxmlformats-officedocument.wordprocessingml.document)
- JPEG (image/jpeg)
- PNG (image/png)

##### File Size Limit
Maximum file size: 10MB

#### Response
```json
{
  "message": "Document uploaded successfully",
  "documentId": 123,
  "fileUrl": "/uploads/filename.pdf",
  "verificationStatus": "PENDING",
  "professionalRecordId": 456  // if provided
}
```

### Get Document (User)
Retrieve document details for authenticated user.

```http
GET /:documentId
```

#### Request
- Method: `GET`
- Authentication: Required (User)

#### Response
```json
{
  "message": "Document retrieved successfully",
  "document": {
    "id": 123,
    "fileName": "document.pdf",
    "fileUrl": "/uploads/filename.pdf",
    "fileSize": 1024,
    "mimeType": "application/pdf",
    "verificationStatus": "PENDING",
    "verificationDate": "2024-03-20T10:00:00Z",
    "verifiedBy": "admin.username",
    "verificationNotes": "Verification notes",
    "createdAt": "2024-03-20T09:00:00Z",
    "updatedAt": "2024-03-20T09:00:00Z",
    "professionalRecord": {
      "id": 456,
      "title": "Record Title",
      "institution": "Institution Name"
    }
  }
}
```

### Get Document (Admin)
Retrieve document details for admin view.

```http
GET /admin/:documentId
```

#### Request
- Method: `GET`
- Authentication: Required (Admin)

#### Response
Same as user document response, but includes additional admin-specific information.

### Verify Document
Verify or reject a document (Admin only).

```http
PUT /verify/:documentId
```

#### Request
- Method: `PUT`
- Authentication: Required (Admin)
- Content-Type: `application/json`

##### Body
```json
{
  "status": "VERIFIED",  // or "REJECTED"
  "notes": "Optional verification notes"
}
```

#### Response
```json
{
  "message": "Document verification updated successfully",
  "status": "VERIFIED",
  "professionalRecordId": 456  // if linked to a professional record
}
```

### List Professional Record Documents
Get all documents associated with a professional record.

```http
GET /professional-record/:professionalRecordId
```

#### Request
- Method: `GET`
- Authentication: Required (User)

#### Response
```json
{
  "message": "Documents retrieved successfully",
  "documents": [
    {
      "id": 123,
      "fileName": "document.pdf",
      "fileUrl": "/uploads/filename.pdf",
      "fileSize": 1024,
      "mimeType": "application/pdf",
      "verificationStatus": "VERIFIED",
      "verificationDate": "2024-03-20T10:00:00Z",
      "verifiedBy": "admin.username",
      "verificationNotes": "Verification notes",
      "createdAt": "2024-03-20T09:00:00Z",
      "updatedAt": "2024-03-20T09:00:00Z"
    }
  ]
}
```

## Error Responses

### Common Error Codes
- `400 Bad Request`: Invalid input parameters
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Document or resource not found
- `413 Payload Too Large`: File size exceeds limit
- `415 Unsupported Media Type`: Invalid file type
- `500 Internal Server Error`: Server-side error

### Error Response Format
```json
{
  "message": "Error description",
  "error": "Detailed error message"  // included in development
}
```

## Database Schema
Documents are stored in the `document_records` table with the following key fields:
- `id`: Unique identifier
- `user_id`: Owner of the document
- `file_path`: Physical file location
- `file_url`: URL to access the document
- `file_hash`: SHA-256 hash of the file
- `verification_status`: Current verification status
- `verified_by`: Admin ID who verified the document
- `verification_date`: When the document was verified

Professional records link to documents via the `document_url` field in the `professional_records` table.

## Audit Trail
All document operations are logged in the `audit_logs` table, including:
- Document uploads
- Verification status changes
- Access attempts
- Professional record linkages

## Notes
1. All dates are in ISO 8601 format
2. File URLs are relative to the server's base URL
3. Verification status changes trigger updates to linked professional records
4. File hashes are computed using SHA-256
5. Uploaded files are stored in the `/uploads` directory 