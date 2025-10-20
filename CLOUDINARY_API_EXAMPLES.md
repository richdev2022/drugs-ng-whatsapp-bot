# Cloudinary Image Storage API Examples

Complete examples for using all image upload endpoints with the Drugs.ng WhatsApp Bot application.

## Quick Start

All examples use the base URL: `http://localhost:10000` (or your production domain)

---

## Healthcare Product Images

### 1. Upload Healthcare Product Image

Upload an image for a healthcare product like a thermometer, pulse oximeter, etc.

**cURL Example:**
```bash
curl -X POST http://localhost:10000/api/healthcare-products/upload-image \
  -F "file=@thermometer.jpg" \
  -F "productId=2" \
  -F "filename=digital-thermometer-braun"
```

**JavaScript/Fetch Example:**
```javascript
const uploadProductImage = async (productId, imageFile) => {
  const formData = new FormData();
  formData.append('file', imageFile);
  formData.append('productId', productId);
  formData.append('filename', `product-${productId}`);

  const response = await fetch('/api/healthcare-products/upload-image', {
    method: 'POST',
    body: formData
  });

  return response.json();
};

// Usage
const fileInput = document.querySelector('input[type="file"]');
const result = await uploadProductImage(2, fileInput.files[0]);
console.log('Image URL:', result.data.url);
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Healthcare product image uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/dtsfoisf2/image/upload/v1234567890/drugs-ng/products/healthcare/digital-thermometer-braun.jpg",
    "publicId": "drugs-ng/products/healthcare/digital-thermometer-braun",
    "fileSize": 245000,
    "mimeType": "image/jpeg"
  }
}
```

---

### 2. Get Healthcare Product Image

Retrieve the stored image URL for a product.

**cURL Example:**
```bash
curl http://localhost:10000/api/healthcare-products/2/image
```

**JavaScript/Fetch Example:**
```javascript
const getProductImage = async (productId) => {
  const response = await fetch(`/api/healthcare-products/${productId}/image`);
  return response.json();
};

// Usage
const result = await getProductImage(2);
if (result.success && result.data.imageUrl) {
  document.querySelector('img').src = result.data.imageUrl;
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "productId": 2,
    "productName": "Digital Thermometer",
    "imageUrl": "https://res.cloudinary.com/dtsfoisf2/image/upload/v1234567890/drugs-ng/products/healthcare/digital-thermometer-braun.jpg"
  }
}
```

---

### 3. Update Healthcare Product Image

Replace the image for an existing product.

**cURL Example:**
```bash
curl -X PUT http://localhost:10000/api/healthcare-products/2/image \
  -F "file=@new-thermometer-image.png" \
  -F "filename=digital-thermometer-v2"
```

**JavaScript/Fetch Example:**
```javascript
const updateProductImage = async (productId, newImageFile) => {
  const formData = new FormData();
  formData.append('file', newImageFile);
  formData.append('filename', `product-${productId}-updated`);

  const response = await fetch(`/api/healthcare-products/${productId}/image`, {
    method: 'PUT',
    body: formData
  });

  return response.json();
};

// Usage
const fileInput = document.querySelector('input[type="file"]');
const result = await updateProductImage(2, fileInput.files[0]);
console.log('Updated Image URL:', result.data.imageUrl);
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Product image updated successfully",
  "data": {
    "productId": 2,
    "imageUrl": "https://res.cloudinary.com/dtsfoisf2/image/upload/v1234567890/drugs-ng/products/healthcare/digital-thermometer-v2.png"
  }
}
```

---

## Doctor Profile Images

### 1. Upload Doctor Image

Upload a profile picture for a doctor.

**cURL Example:**
```bash
curl -X POST http://localhost:10000/api/doctors/upload-image \
  -F "file=@dr-adaobi-profile.jpg" \
  -F "doctorId=1" \
  -F "filename=dr-adaobi-cardiologist"
```

**JavaScript/Fetch Example:**
```javascript
const uploadDoctorImage = async (doctorId, imageFile) => {
  const formData = new FormData();
  formData.append('file', imageFile);
  formData.append('doctorId', doctorId);
  formData.append('filename', `doctor-${doctorId}`);

  const response = await fetch('/api/doctors/upload-image', {
    method: 'POST',
    body: formData
  });

  return response.json();
};

// Usage
const result = await uploadDoctorImage(1, profileImageFile);
console.log('Doctor Image URL:', result.data.url);
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Doctor image uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/dtsfoisf2/image/upload/v1234567890/drugs-ng/doctors/dr-adaobi-cardiologist.jpg",
    "publicId": "drugs-ng/doctors/dr-adaobi-cardiologist",
    "fileSize": 185000,
    "mimeType": "image/jpeg"
  }
}
```

---

### 2. Get Doctor Profile Image

Retrieve doctor details with profile image.

**cURL Example:**
```bash
curl http://localhost:10000/api/doctors/1/image
```

**JavaScript/Fetch Example:**
```javascript
const getDoctorImage = async (doctorId) => {
  const response = await fetch(`/api/doctors/${doctorId}/image`);
  return response.json();
};

// Usage
const result = await getDoctorImage(1);
console.log('Doctor Info:', result.data);
// Output:
// {
//   doctorId: 1,
//   doctorName: "Dr. Adaobi",
//   specialty: "Cardiologist",
//   location: "Lagos",
//   imageUrl: "https://res.cloudinary.com/..."
// }
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "doctorId": 1,
    "doctorName": "Dr. Adaobi",
    "specialty": "Cardiologist",
    "location": "Lagos",
    "imageUrl": "https://res.cloudinary.com/dtsfoisf2/image/upload/v1234567890/drugs-ng/doctors/dr-adaobi-cardiologist.jpg"
  }
}
```

---

### 3. Update Doctor Profile Image

Update a doctor's profile picture.

**cURL Example:**
```bash
curl -X PUT http://localhost:10000/api/doctors/1/image \
  -F "file=@dr-adaobi-new-photo.jpg" \
  -F "filename=dr-adaobi-2024"
```

**JavaScript/Fetch Example:**
```javascript
const updateDoctorImage = async (doctorId, newImageFile) => {
  const formData = new FormData();
  formData.append('file', newImageFile);
  formData.append('filename', `doctor-${doctorId}-updated`);

  const response = await fetch(`/api/doctors/${doctorId}/image`, {
    method: 'PUT',
    body: formData
  });

  return response.json();
};

// Usage
const result = await updateDoctorImage(1, newProfileImage);
console.log('Updated Doctor Image:', result.data.imageUrl);
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Doctor image updated successfully",
  "data": {
    "doctorId": 1,
    "doctorName": "Dr. Adaobi",
    "imageUrl": "https://res.cloudinary.com/dtsfoisf2/image/upload/v1234567890/drugs-ng/doctors/dr-adaobi-2024.jpg"
  }
}
```

---

### 4. Get All Doctors with Images

Retrieve all doctors with their profile images and details.

**cURL Example:**
```bash
# Get all doctors
curl http://localhost:10000/api/doctors/with-images

# Filter by specialty
curl "http://localhost:10000/api/doctors/with-images?specialty=Cardiologist"

# Filter by location
curl "http://localhost:10000/api/doctors/with-images?location=Lagos"

# Filter by availability
curl "http://localhost:10000/api/doctors/with-images?available=true"

# Combine filters
curl "http://localhost:10000/api/doctors/with-images?specialty=Cardiologist&location=Lagos&available=true"
```

**JavaScript/Fetch Example:**
```javascript
const getDoctorsWithImages = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/doctors/with-images?${params}`);
  return response.json();
};

// Usage examples
// Get all doctors
const allDoctors = await getDoctorsWithImages();

// Get cardiologists in Lagos
const cardiologists = await getDoctorsWithImages({
  specialty: 'Cardiologist',
  location: 'Lagos',
  available: 'true'
});

cardiologists.data.forEach(doctor => {
  console.log(`${doctor.name} - ${doctor.imageUrl}`);
});
```

**Expected Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": 1,
      "name": "Dr. Adaobi",
      "specialty": "Cardiologist",
      "location": "Lagos",
      "available": true,
      "rating": 4.8,
      "imageUrl": "https://res.cloudinary.com/dtsfoisf2/image/upload/v1234567890/drugs-ng/doctors/dr-adaobi-cardiologist.jpg"
    },
    {
      "id": 2,
      "name": "Dr. Ken",
      "specialty": "Pediatrician",
      "location": "Lagos",
      "available": true,
      "rating": 4.5,
      "imageUrl": "https://res.cloudinary.com/dtsfoisf2/image/upload/v1234567890/drugs-ng/doctors/dr-ken-pediatrician.jpg"
    }
  ]
}
```

---

## Prescription Files

### 1. Upload Prescription

Upload a prescription document (PDF or image) for an order.

**cURL Example:**
```bash
curl -X POST http://localhost:10000/api/prescriptions/upload \
  -F "file=@patient-prescription.pdf" \
  -F "orderId=5"
```

**JavaScript/Fetch Example:**
```javascript
const uploadPrescription = async (orderId, prescriptionFile) => {
  const formData = new FormData();
  formData.append('file', prescriptionFile);
  formData.append('orderId', orderId);

  const response = await fetch('/api/prescriptions/upload', {
    method: 'POST',
    body: formData
  });

  return response.json();
};

// Usage
const fileInput = document.querySelector('input[type="file"]');
const result = await uploadPrescription(5, fileInput.files[0]);
console.log('Prescription URL:', result.data.fileUrl);
console.log('Status:', result.data.verificationStatus);
```

**Expected Response:**
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

## Complete HTML Form Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>Image Upload Form</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; }
    .form-group { margin-bottom: 20px; }
    label { display: block; margin-bottom: 5px; font-weight: bold; }
    input, select, button { padding: 8px; font-size: 14px; }
    button { background: #007bff; color: white; border: none; cursor: pointer; padding: 10px 20px; }
    button:hover { background: #0056b3; }
    .response { margin-top: 20px; padding: 10px; background: #f0f0f0; border-radius: 4px; }
    .image-preview { margin-top: 10px; max-width: 300px; }
  </style>
</head>
<body>
  <h1>Image Upload Demo</h1>

  <!-- Healthcare Product Image -->
  <form id="productForm">
    <h2>Upload Healthcare Product Image</h2>
    <div class="form-group">
      <label for="productId">Product ID:</label>
      <input type="number" id="productId" name="productId" required>
    </div>
    <div class="form-group">
      <label for="productImage">Image:</label>
      <input type="file" id="productImage" accept="image/*" required>
    </div>
    <button type="submit">Upload Product Image</button>
  </form>

  <!-- Doctor Profile Image -->
  <form id="doctorForm">
    <h2>Upload Doctor Image</h2>
    <div class="form-group">
      <label for="doctorId">Doctor ID:</label>
      <input type="number" id="doctorId" name="doctorId" required>
    </div>
    <div class="form-group">
      <label for="doctorImage">Image:</label>
      <input type="file" id="doctorImage" accept="image/*" required>
    </div>
    <button type="submit">Upload Doctor Image</button>
  </form>

  <!-- Prescription Upload -->
  <form id="prescriptionForm">
    <h2>Upload Prescription</h2>
    <div class="form-group">
      <label for="orderId">Order ID:</label>
      <input type="number" id="orderId" name="orderId" required>
    </div>
    <div class="form-group">
      <label for="prescriptionFile">Prescription (PDF or Image):</label>
      <input type="file" id="prescriptionFile" accept=".pdf,image/*" required>
    </div>
    <button type="submit">Upload Prescription</button>
  </form>

  <div id="response" class="response" style="display: none;">
    <h3>Response:</h3>
    <pre id="responseText"></pre>
    <div id="imagePreview" class="image-preview"></div>
  </div>

  <script>
    const showResponse = (data) => {
      const responseDiv = document.getElementById('response');
      document.getElementById('responseText').textContent = JSON.stringify(data, null, 2);
      
      if (data.success && data.data && data.data.url) {
        document.getElementById('imagePreview').innerHTML = 
          `<img src="${data.data.url}" alt="Uploaded image" style="max-width: 100%;">`;
      }
      
      responseDiv.style.display = 'block';
    };

    document.getElementById('productForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData();
      formData.append('file', document.getElementById('productImage').files[0]);
      formData.append('productId', document.getElementById('productId').value);
      
      const response = await fetch('/api/healthcare-products/upload-image', {
        method: 'POST',
        body: formData
      });
      
      showResponse(await response.json());
    });

    document.getElementById('doctorForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData();
      formData.append('file', document.getElementById('doctorImage').files[0]);
      formData.append('doctorId', document.getElementById('doctorId').value);
      
      const response = await fetch('/api/doctors/upload-image', {
        method: 'POST',
        body: formData
      });
      
      showResponse(await response.json());
    });

    document.getElementById('prescriptionForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData();
      formData.append('file', document.getElementById('prescriptionFile').files[0]);
      formData.append('orderId', document.getElementById('orderId').value);
      
      const response = await fetch('/api/prescriptions/upload', {
        method: 'POST',
        body: formData
      });
      
      showResponse(await response.json());
    });
  </script>
</body>
</html>
```

---

## Error Handling Examples

### Handle Upload Errors

```javascript
const handleUploadError = (error) => {
  const errorMessages = {
    'No file provided': 'Please select a file to upload',
    'Invalid file type': 'Only JPEG, PNG, GIF, WebP, and PDF files are allowed',
    'File is empty': 'The selected file is empty',
    'not found': 'The resource was not found',
    'Order ID is required': 'Please provide an Order ID'
  };

  for (const [key, message] of Object.entries(errorMessages)) {
    if (error.includes(key)) {
      return message;
    }
  }

  return 'An unexpected error occurred. Please try again.';
};

// Usage
const response = await fetch('/api/prescriptions/upload', { method: 'POST', body: formData });
const result = await response.json();

if (!result.success) {
  const errorMsg = handleUploadError(result.error);
  alert(errorMsg);
}
```

---

## Testing with Thunder Client or Postman

### Create a Postman Collection

1. **New Request → POST** → `{{baseUrl}}/api/healthcare-products/upload-image`
   - **Body** → form-data
   - Key: `file` → Value: Select file from computer
   - Key: `productId` → Value: `2`

2. **New Request → GET** → `{{baseUrl}}/api/healthcare-products/2/image`

3. **New Request → POST** → `{{baseUrl}}/api/doctors/upload-image`
   - **Body** → form-data
   - Key: `file` → Value: Select file from computer
   - Key: `doctorId` → Value: `1`

4. **New Request → GET** → `{{baseUrl}}/api/doctors/with-images?specialty=Cardiologist`

5. **New Request → POST** → `{{baseUrl}}/api/prescriptions/upload`
   - **Body** → form-data
   - Key: `file` → Value: Select PDF/image file
   - Key: `orderId` → Value: `5`

---

## Production Deployment Notes

When deploying to production:

1. Replace `http://localhost:10000` with your production domain
2. Use HTTPS for all requests
3. Cloudinary credentials are stored as secure environment variables
4. Images are automatically served through Cloudinary's global CDN
5. Monitor Cloudinary dashboard for storage and bandwidth usage
6. Implement request validation and rate limiting on your API

For more Cloudinary features and transformations, visit [Cloudinary Docs](https://cloudinary.com/documentation)
