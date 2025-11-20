# IPFS Integration Guide

## Overview
This implementation demonstrates IPFS integration with 3 types of data storage as required:

### 3 Types of Data Storage:
1. **Images** - Car photos, driver licenses, user avatars
2. **PDF Documents** - Generated contract PDFs 
3. **JSON Metadata** - Comprehensive contract metadata

### 2 Main Operations:
1. **Upload** - Store files and data on IPFS via Pinata
2. **Retrieve** - Access stored data from IPFS

## Setup Instructions

### 1. Install Dependencies
```bash
npm install multer node-fetch form-data pdfkit
```

### 2. Configure Pinata
1. Go to https://app.pinata.cloud/
2. Create account and get API credentials
3. Update `.env` file with your Pinata credentials:
```env
PINATA_API_KEY=your_pinata_api_key  
PINATA_SECRET_KEY=your_pinata_secret_key
PINATA_JWT=your_pinata_jwt_token
```

### 3. Start Server
```bash
node backend/server.js
```

### 4. Open Demo Page
Open `frontend/html/ipfs_demo.html` in your browser

## API Endpoints

### 1. Upload Image
- **Endpoint:** `POST /api/ipfs/upload-image`
- **Type:** Multipart form data
- **Purpose:** Upload car photos, driver licenses, avatars

### 2. Generate Contract PDF  
- **Endpoint:** `POST /api/ipfs/upload-contract-pdf`
- **Type:** JSON
- **Purpose:** Generate and upload contract PDF

### 3. Upload Metadata
- **Endpoint:** `POST /api/ipfs/upload-metadata` 
- **Type:** JSON
- **Purpose:** Create comprehensive contract metadata

### 4. Retrieve Data
- **Endpoint:** `GET /api/ipfs/retrieve/:cid`
- **Type:** GET parameter
- **Purpose:** Retrieve any file/data from IPFS

## Demo Usage

### Upload Image Example:
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('contractId', 'CT001');
formData.append('imageType', 'car');

fetch('/api/ipfs/upload-image', {
    method: 'POST',
    body: formData
})
```

### Generate PDF Example:
```javascript
fetch('/api/ipfs/upload-contract-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contractId: 'CT001' })
})
```

### Upload Metadata Example:
```javascript
fetch('/api/ipfs/upload-metadata', {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
        contractId: 'CT001',
        additionalData: { verified: true }
    })
})
```

### Retrieve Data Example:
```javascript
fetch('/api/ipfs/retrieve/QmYourCIDHere')
```

## Sample Data for Testing

Use these existing Contract IDs from your database:
- CT001, CT002, CT003, etc.

## File Structure
```
backend/
  └── server.js (IPFS endpoints added)
frontend/
  └── html/
      └── ipfs_demo.html (Demo interface)
uploads/ (temporary file storage)
```

## Benefits
- **Decentralized Storage**: Files stored on IPFS network
- **Immutable**: Content cannot be changed once uploaded
- **Content Addressing**: Files accessed by content hash
- **Redundancy**: Multiple nodes store copies
- **Cost Effective**: Pay only for pinning service

## Next Steps
1. Update `.env` with real Pinata credentials
2. Test all endpoints using demo page
3. Integrate IPFS features into main application
4. Add IPFS URLs to contract creation workflow