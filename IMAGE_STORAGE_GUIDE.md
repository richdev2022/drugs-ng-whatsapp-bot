# Cloudinary Image Storage Integration Guide

## Overview

This application now uses **Cloudinary** for centralized image storage. All images uploaded through the application are automatically stored on Cloudinary and secure URLs are returned for display.

## Setup Summary

### Environment Variables (Already Configured)

The following Cloudinary credentials have been configured in your environment:

```
CLOUDINARY_CLOUD_NAME=dtsfoisf2
CLOUDINARY_API_KEY=593457425811229
CLOUDINARY_API_SECRET=Zs1N-cNYVspsyX1NeFQyoXQA9iY
```

### Features

✅ **Healthcare Product Images** - Upload and manage product images  
✅ **Doctor Profile Images** - Store doctor/pharmacist profile pictures  
✅ **Prescription Files** - Upload prescription documents (PDF/Images)  
✅ **Automatic URL Storage** - Image URLs automatically stored in database  
✅ **Secure CDN Delivery** - All images served via Cloudinary's global CDN  
✅ **File Validation** - Only allows JPEG, PNG, WebP, GIF, and PDF files  
✅ **Size Limit** - Maximum 10MB per file  

## API Endpoints

### 1. Upload Healthcare Product Image

**POST** `/api/healthcare-products/upload-image`

Upload an image for a healthcare product and get back a secure Cloudinary URL.

**Request:**
```bash
curl -X POST http://localhost:10000/api/healthcare-products/upload-image \
  -F "file=@product-image.jpg" \
  -F "productId=1" \
  -F "filename=healthcare-product-1"
```

**Form Parameters:**
- `file` (required): Image file (JPEG, PNG, WebP, GIF, PDF)
- `productId` (optional): Healthcare product ID
- `filename` (optional): Custom filename for the image

**Response:**
```json
{
  "success": true,
  "message": "Healthcare product image uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/dtsfoisf2/image/upload/v1234567890/drugs-ng/products/healthcare/healthcare-product-1.jpg",
    "publicId": "drugs-ng/products/healthcare/healthcare-product-1",
    "fileSize": 245000,
    "mimeType": "image/jpeg"
  }
}
```

---

### 2. Get Healthcare Product Image URL

**GET** `/api/healthcare-products/:productId/image`

Retrieve the stored image URL for a healthcare product.

**Request:**
```bash
curl http://localhost:10000/api/healthcare-products/1/image
```

**Response:**
```json
{
  "success": true,
  "data": {
    "productId": 1,
    "productName": "Digital Thermometer",
    "imageUrl": "https://res.cloudinary.com/dtsfoisf2/image/upload/v1234567890/drugs-ng/products/healthcare/healthcare-product-1.jpg"
  }
}
```

---

### 3. Update Healthcare Product Image

**PUT** `/api/healthcare-products/:productId/image`

Update the image for an existing healthcare product.

**Request:**
```bash
curl -X PUT http://localhost:10000/api/healthcare-products/1/image \
  -F "file=@new-product-image.png" \
  -F "filename=healthcare-product-1-v2"
```

**Response:**
```json
{
  "success": true,
  "message": "Product image updated successfully",
  "data": {
    "productId": 1,
    "imageUrl": "https://res.cloudinary.com/dtsfoisf2/image/upload/v1234567890/drugs-ng/products/healthcare/healthcare-product-1-v2.png"
  }
}
```

---

### 4. Upload Prescription File

**POST** `/api/prescriptions/upload`

Upload a prescription document (image or PDF) for a specific order.

**Request:**
```bash
curl -X POST http://localhost:10000/api/prescriptions/upload \
  -F "file=@prescription.pdf" \
  -F "orderId=5"
```

**Form Parameters:**
- `file` (required): Prescription file (JPEG, PNG, WebP, GIF, or PDF)
- `orderId` (required): Order ID for this prescription

**Response:**
```json
{
  "success": true,
  "message": "Prescription uploaded successfully",
  "data": {
    "prescriptionId": 3,
    "fileUrl": "https://res.cloudinary.com/dtsfoisf2/image/upload/v1234567890/drugs-ng/prescriptions/prescription-order-5-1699564800000.pdf",
    "verificationStatus": "Pending"
  }
}
```

---

## Integration Examples

### Using JavaScript/Node.js with Fetch API

```javascript
// Upload healthcare product image
async function uploadProductImage(productId, imageFile) {
  const formData = new FormData();
  formData.append('file', imageFile);
  formData.append('productId', productId);
  formData.append('filename', `product-${productId}`);

  try {
    const response = await fetch('/api/healthcare-products/upload-image', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    if (result.success) {
      console.log('Image uploaded:', result.data.url);
      return result.data.url;
    } else {
      console.error('Upload failed:', result.error);
    }
  } catch (error) {
    console.error('Upload error:', error);
  }
}

// Get product image URL
async function getProductImage(productId) {
  try {
    const response = await fetch(`/api/healthcare-products/${productId}/image`);
    const result = await response.json();
    
    if (result.success && result.data.imageUrl) {
      return result.data.imageUrl;
    }
    return null;
  } catch (error) {
    console.error('Error fetching image:', error);
  }
}

// Upload prescription
async function uploadPrescription(orderId, prescriptionFile) {
  const formData = new FormData();
  formData.append('file', prescriptionFile);
  formData.append('orderId', orderId);

  try {
    const response = await fetch('/api/prescriptions/upload', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    if (result.success) {
      console.log('Prescription uploaded:', result.data.fileUrl);
      return result.data;
    } else {
      console.error('Upload failed:', result.error);
    }
  } catch (error) {
    console.error('Upload error:', error);
  }
}
```

### Using HTML Form

```html
<!-- Healthcare Product Image Upload Form -->
<form id="productImageForm">
  <input type="hidden" name="productId" value="1">
  <input type="hidden" name="filename" value="product-1">
  <input type="file" name="file" accept="image/*" required>
  <button type="submit">Upload Product Image</button>
</form>

<script>
document.getElementById('productImageForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const response = await fetch('/api/healthcare-products/upload-image', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  if (result.success) {
    alert('Image uploaded successfully: ' + result.data.url);
  } else {
    alert('Upload failed: ' + result.error);
  }
});
</script>

<!-- Prescription Upload Form -->
<form id="prescriptionForm">
  <input type="hidden" name="orderId" value="5">
  <input type="file" name="file" accept=".pdf,image/*" required>
  <button type="submit">Upload Prescription</button>
</form>

<script>
document.getElementById('prescriptionForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const response = await fetch('/api/prescriptions/upload', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  if (result.success) {
    alert('Prescription uploaded: ' + result.data.fileUrl);
  } else {
    alert('Upload failed: ' + result.error);
  }
});
</script>
```

## File Organization on Cloudinary

Images are organized in the following folder structure:

```
drugs-ng/
├── products/
│   └── healthcare/              # Healthcare product images
├── prescriptions/               # Prescription documents
└── doctors/                     # Doctor profile images (can be extended)
```

## Image Retrieval & Display

### Database Storage

Image URLs are automatically stored in the database for easy retrieval:

- **Healthcare Products**: `healthcare_products.imageUrl`
- **Products**: `products.imageUrl`
- **Doctors**: `doctors.imageUrl`
- **Prescriptions**: `prescriptions.fileUrl`

### Fetching Images

```javascript
// Example: Fetch and display product image
const product = await Product.findByPk(1);
console.log(product.imageUrl); // Returns Cloudinary URL
// Output: https://res.cloudinary.com/dtsfoisf2/image/upload/v.../image.jpg

// Display in HTML
const img = document.createElement('img');
img.src = product.imageUrl;
document.body.appendChild(img);
```

## Error Handling

The upload endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "File is empty"
}
```

**Common Errors:**

| Error | Cause | Solution |
|-------|-------|----------|
| "No file provided" | Form doesn't include file | Ensure `file` field in form data |
| "Invalid file type" | File is not JPEG/PNG/GIF/WebP/PDF | Upload only supported formats |
| "File size exceeds limit" | File larger than 10MB | Compress image before uploading |
| "Order ID is required" | Missing orderId parameter | Include `orderId` in form data |
| "Product not found" | Invalid product ID | Verify product exists in database |

## File Size & Performance

- **Maximum file size**: 10MB per upload
- **Supported formats**: JPEG, PNG, WebP, GIF, PDF
- **Recommended image sizes**:
  - Product images: 1000x1000px
  - Doctor profiles: 500x500px
  - Prescriptions: Any size (auto-scaled)

## Security Features

✅ **File Type Validation** - Only allows whitelisted MIME types  
✅ **Size Limits** - Maximum 10MB per file  
✅ **Secure URLs** - All URLs use HTTPS and are signed  
✅ **Access Control** - Cloudinary API credentials stored securely as env variables  
✅ **Automatic Cleanup** - Old images can be deleted through Cloudinary dashboard  

## Accessing the Cloudinary Dashboard

Visit **[Cloudinary Dashboard](https://cloudinary.com/console/)** with your account:
- **Cloud Name**: dtsfoisf2
- **API Key**: 593457425811229

From the dashboard you can:
- View all uploaded images
- Manage folders and organize assets
- Monitor bandwidth and storage usage
- Set up image transformations (resizing, cropping, etc.)
- View usage statistics

## Image Transformations (Advanced)

Cloudinary supports powerful image transformations. You can modify URLs to:

```
// Resize image to 300x300px
https://res.cloudinary.com/dtsfoisf2/image/upload/w_300,h_300/...

// Crop to square
https://res.cloudinary.com/dtsfoisf2/image/upload/w_300,h_300,c_fill/...

// Convert to WebP format (better compression)
https://res.cloudinary.com/dtsfoisf2/image/upload/f_webp/...

// Add quality optimization
https://res.cloudinary.com/dtsfoisf2/image/upload/q_auto/...
```

## Troubleshooting

### Images not uploading?
1. Check file format (must be JPEG, PNG, GIF, WebP, or PDF)
2. Verify file size is under 10MB
3. Ensure form data includes `file` field
4. Check browser console for error messages

### Getting 404 on image URLs?
1. Verify product/prescription exists in database
2. Check that imageUrl is populated in database
3. Test direct URL in browser to confirm accessibility

### Slow image loading?
1. Cloudinary provides global CDN - images should load fast
2. Consider using image transformations to reduce file size
3. Check network tab in browser DevTools

## Best Practices

1. **Optimize images before upload**: Compress images before sending to reduce bandwidth
2. **Use appropriate formats**: JPEG for photos, PNG for graphics with transparency
3. **Provide meaningful filenames**: Use descriptive names for easier management
4. **Regular cleanup**: Delete unused images from Cloudinary dashboard
5. **Monitor usage**: Check Cloudinary dashboard for storage and bandwidth stats
6. **Handle upload failures**: Implement retry logic with exponential backoff

## Support

For Cloudinary-specific issues, visit [Cloudinary Documentation](https://cloudinary.com/documentation)

For application-specific issues, check the error logs or contact the development team.
