// Owner cars UI script - only shows cars owned by current user
document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.querySelector('#carsTable tbody');
  const searchInput = document.getElementById('searchInput');
  const refreshBtn = document.getElementById('refreshBtn');
  const createBtn = document.getElementById('createBtn');
  const createModal = document.getElementById('createModal');
  const createForm = document.getElementById('createForm');
  const cancelCreate = document.getElementById('cancelCreate');
  const editModal = document.getElementById('editModal');
  const editForm = document.getElementById('editForm');
  const cancelEdit = document.getElementById('cancelEdit');

  // API Base URL - Update với backend URL của bạn
  const API_BASE_URL = 'http://localhost:3000/api/cars';

  // Get current user from AuthManager
  const currentUser = AuthManager.getCurrentUser();
  if (!currentUser) {
    alert('Please login first');
    window.location.href = 'login.html';
    return;
  }

  async function fetchOwnerCars(searchQuery = '') {
    try {
      const url = searchQuery 
        ? `${API_BASE_URL}?search=${encodeURIComponent(searchQuery)}&ownerId=${currentUser.UserId}`
        : `${API_BASE_URL}?ownerId=${currentUser.UserId}`;
      
      const res = await fetch(url);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to fetch cars' }));
        throw new Error(errorData.error || 'Failed to fetch cars');
      }
      const data = await res.json();
      return data.cars || [];
    } catch (e) {
      console.error('Error fetching cars:', e);
      alert('Error loading cars: ' + e.message);
      return [];
    }
  }

  function formatPrice(price) {
    if (!price && price !== 0) return '0.00 CPT';
    const numericPrice = parseFloat(price);
    if (Number.isNaN(numericPrice)) return '0.00 CPT';
    return numericPrice.toFixed(2) + ' CPT';
  }

  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.getFullYear();
  }

  function getStatusBadgeClass(status) {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'available') return 'available';
    if (statusLower === 'rented') return 'rented';
    if (statusLower === 'maintenance') return 'maintenance';
    if (statusLower === 'sold') return 'sold';
    return 'available';
  }

  function renderRows(cars) {
    tableBody.innerHTML = '';
    if (cars.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: var(--gray-600);">No cars found</td></tr>';
      return;
    }
    
    cars.forEach(car => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${car.CarId || ''}</td>
        <td>
          <img src="${car.ImageURL || 'https://via.placeholder.com/60x40'}" 
               alt="${car.CarName || 'Car'}" 
               onerror="this.src='https://via.placeholder.com/60x40'">
        </td>
        <td>${car.CarName || ''}</td>
        <td>${car.Brand || ''}</td>
        <td>${formatDate(car.ModelYear)}</td>
        <td class="price">${formatPrice(car.PriceRent)}</td>
        <td class="price">${formatPrice(car.PriceBuy)}</td>
        <td><span class="status-badge ${getStatusBadgeClass(car.Status)}">${(car.Status || 'available').charAt(0).toUpperCase() + (car.Status || 'available').slice(1)}</span></td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-edit" data-action="edit" data-id="${car.CarId}">Edit</button>
            <button class="btn btn-delete" data-action="delete" data-id="${car.CarId}">Delete</button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });
    
    updateSummary(cars);
  }

  function updateSummary(cars) {
    const total = cars.length;
    const available = cars.filter(c => (c.Status || '').toLowerCase() === 'available').length;
    const rented = cars.filter(c => (c.Status || '').toLowerCase() === 'rented').length;
    
    document.getElementById('totalCarsCount').textContent = total;
    document.getElementById('availableCarsCount').textContent = available;
    document.getElementById('rentedCarsCount').textContent = rented;
  }

  async function loadAndRender(searchQuery = '') {
    const cars = await fetchOwnerCars(searchQuery);
    renderRows(cars);
  }

  // Table event delegation
  document.querySelector('#carsTable').addEventListener('click', (e) => {
    const action = e.target.getAttribute('data-action');
    const carId = e.target.getAttribute('data-id');
    
    if (action === 'edit') {
      openEditModal(carId);
    } else if (action === 'delete') {
      doDelete(carId);
    }
  });

  async function openEditModal(carId) {
    try {
      const res = await fetch(`${API_BASE_URL}/${encodeURIComponent(carId)}`);
      if (!res.ok) {
        throw new Error('Failed to fetch car details');
      }
      const data = await res.json();
      const car = data.car;
      
      if (!car) {
        throw new Error('Car not found');
      }
      
      // Check if current user owns this car
      if (car.OwnerId !== currentUser.UserId) {
        alert('You can only edit your own cars');
        return;
      }
      
      populateEditForm(car);
      editModal.classList.remove('hidden');
    } catch (e) {
      console.error('Error fetching car:', e);
      alert('Error loading car details: ' + e.message);
    }
  }

  function populateEditForm(car) {
    document.getElementById('editCarId').value = car.CarId || '';
    document.getElementById('editCarName').value = car.CarName || '';
    document.getElementById('editBrand').value = car.Brand || '';
    
    const modelYear = car.ModelYear ? new Date(car.ModelYear).getFullYear() : '';
    document.getElementById('editModelYear').value = modelYear;
    
    document.getElementById('editPriceRent').value = car.PriceRent || '';
    document.getElementById('editPriceBuy').value = car.PriceBuy || '';
    document.getElementById('editStatus').value = (car.Status || 'available').toLowerCase();
    document.getElementById('editImageURL').value = car.ImageURL || '';
    document.getElementById('editDescription').value = car.Description || '';
    
    // Update image preview
    updateEditImagePreview(car.ImageURL);
  }

  function updateImagePreview(url) {
    const preview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    if (url) {
      previewImg.src = url;
      preview.style.display = 'block';
      previewImg.onerror = () => {
        preview.style.display = 'none';
      };
    } else {
      preview.style.display = 'none';
    }
  }

  function updateEditImagePreview(url) {
    const preview = document.getElementById('editImagePreview');
    const previewImg = document.getElementById('editPreviewImg');
    if (url) {
      previewImg.src = url;
      preview.style.display = 'block';
      previewImg.onerror = () => {
        preview.style.display = 'none';
      };
    } else {
      preview.style.display = 'none';
    }
  }

  // Image URL preview on input
  document.getElementById('imageURL')?.addEventListener('input', (e) => {
    updateImagePreview(e.target.value);
  });

  document.getElementById('editImageURL')?.addEventListener('input', (e) => {
    updateEditImagePreview(e.target.value);
  });

  async function doDelete(carId) {
    if (!confirm('Delete car ' + carId + '? This action cannot be undone.')) return;
    try {
      // First check if current user owns this car
      const carRes = await fetch(`${API_BASE_URL}/${encodeURIComponent(carId)}`);
      if (carRes.ok) {
        const carData = await carRes.json();
        if (carData.car && carData.car.OwnerId !== currentUser.UserId) {
          alert('You can only delete your own cars');
          return;
        }
      }

      const res = await fetch(`${API_BASE_URL}/${encodeURIComponent(carId)}`, { 
        method: 'DELETE'
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Delete failed' }));
        throw new Error(errorData.error || 'Delete failed');
      }
      
      const data = await res.json();
      alert('Car deleted successfully!');
      loadAndRender();
    } catch (e) {
      console.error('Error deleting car:', e);
      alert('Error deleting car: ' + e.message);
    }
  }

  // Create form submission
  createForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
      CarName: document.getElementById('carName').value.trim(),
      Brand: document.getElementById('brand').value.trim(),
      ModelYear: document.getElementById('modelYear').value,
      PriceRent: parseFloat(document.getElementById('priceRent').value) || 0,
      PriceBuy: parseFloat(document.getElementById('priceBuy').value) || 0,
      Status: document.getElementById('status').value,
      ImageURL: document.getElementById('imageURL').value.trim(),
      Description: document.getElementById('description').value.trim(),
      OwnerId: currentUser.UserId // Set current user as owner
    };
    
    try {
      const res = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Create failed' }));
        throw new Error(errorData.error || 'Create failed');
      }
      
      const data = await res.json();
      alert('Car created successfully!');
      createModal.classList.add('hidden');
      createForm.reset();
      updateImagePreview('');
      loadAndRender();
    } catch (e) {
      console.error('Error creating car:', e);
      alert('Error creating car: ' + e.message);
    }
  });

  // Edit form submission
  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const carId = document.getElementById('editCarId').value;
    const formData = {
      CarName: document.getElementById('editCarName').value.trim(),
      Brand: document.getElementById('editBrand').value.trim(),
      ModelYear: document.getElementById('editModelYear').value,
      PriceRent: parseFloat(document.getElementById('editPriceRent').value) || 0,
      PriceBuy: parseFloat(document.getElementById('editPriceBuy').value) || 0,
      Status: document.getElementById('editStatus').value,
      ImageURL: document.getElementById('editImageURL').value.trim(),
      Description: document.getElementById('editDescription').value.trim()
      // Don't allow changing OwnerId
    };
    
    try {
      const res = await fetch(`${API_BASE_URL}/${encodeURIComponent(carId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Update failed' }));
        throw new Error(errorData.error || 'Update failed');
      }
      
      const data = await res.json();
      alert('Car updated successfully!');
      editModal.classList.add('hidden');
      loadAndRender();
    } catch (e) {
      console.error('Error updating car:', e);
      alert('Error updating car: ' + e.message);
    }
  });

  // Modal controls
  createBtn.addEventListener('click', () => {
    createModal.classList.remove('hidden');
  });
  
  cancelCreate.addEventListener('click', () => {
    createModal.classList.add('hidden');
    createForm.reset();
    updateImagePreview('');
  });
  
  cancelEdit.addEventListener('click', () => {
    editModal.classList.add('hidden');
  });
  
  // Close modal when clicking outside
  createModal.addEventListener('click', (e) => {
    if (e.target === createModal) {
      createModal.classList.add('hidden');
      createForm.reset();
      updateImagePreview('');
    }
  });
  
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
      editModal.classList.add('hidden');
    }
  });
  
  refreshBtn.addEventListener('click', () => {
    searchInput.value = '';
    loadAndRender();
  });
  
  // Search with debounce
  let searchTimeout;
  searchInput.addEventListener('input', async (e) => {
    const q = e.target.value.trim();
    
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      loadAndRender(q);
    }, 300); // Wait 300ms after user stops typing
  });

  // Initial load
  loadAndRender();
});