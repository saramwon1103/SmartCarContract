// Admin cars UI script
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
  const API_BASE_URL = 'http://localhost:3000/api/admin/cars';

  async function fetchCars(searchQuery = '') {
    try {
      const url = searchQuery 
        ? `${API_BASE_URL}?search=${encodeURIComponent(searchQuery)}`
        : API_BASE_URL;
      
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
    if (!price) return '$0.00';
    return '$' + parseFloat(price).toFixed(2);
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
      tableBody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 40px; color: var(--gray-600);">No cars found</td></tr>';
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
        <td>${car.OwnerId || ''}</td>
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

  async function loadAndRender() {
    const cars = await fetchCars();
    renderRows(cars);
  }

  tableBody.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (action === 'edit') openEdit(id);
    if (action === 'delete') doDelete(id);
  });

  async function openEdit(carId) {
    try {
      // Fetch full car data from backend
      const res = await fetch(`${API_BASE_URL}/${encodeURIComponent(carId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.car) {
          populateEditForm(data.car);
          editModal.classList.remove('hidden');
          return;
        }
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Car not found' }));
        throw new Error(errorData.error || 'Failed to fetch car');
      }
    } catch (e) {
      console.error('Error fetching car:', e);
      alert('Error loading car: ' + e.message);
    }
  }

  function populateEditForm(car) {
    document.getElementById('carId').value = car.CarId || '';
    document.getElementById('carName').value = car.CarName || '';
    document.getElementById('brand').value = car.Brand || '';
    
    // Format date for input
    let modelYear = car.ModelYear || '';
    if (modelYear && !modelYear.includes('-')) {
      // If it's just a year, convert to date
      modelYear = modelYear + '-01-01';
    }
    document.getElementById('modelYear').value = modelYear;
    
    document.getElementById('priceRent').value = car.PriceRent || '';
    document.getElementById('priceBuy').value = car.PriceBuy || '';
    document.getElementById('status').value = (car.Status || 'available').toLowerCase();
    document.getElementById('imageURL').value = car.ImageURL || '';
    document.getElementById('description').value = car.Description || '';
    document.getElementById('ownerId').value = car.OwnerId || '';
    
    // Update image preview
    updateImagePreview(car.ImageURL);
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

  // Image URL preview on input
  document.getElementById('imageURL')?.addEventListener('input', (e) => {
    updateImagePreview(e.target.value);
  });

  async function doDelete(carId) {
    if (!confirm('Delete car ' + carId + '? This action cannot be undone.')) return;
    try {
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

  editForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    
    const formData = new FormData(editForm);
    const carId = formData.get('carId');
    
    // Convert FormData to JSON object
    const carData = {
      carId: carId,
      carName: formData.get('carName'),
      brand: formData.get('brand'),
      modelYear: formData.get('modelYear'),
      priceRent: parseFloat(formData.get('priceRent')),
      priceBuy: parseFloat(formData.get('priceBuy')),
      status: formData.get('status'),
      imageURL: formData.get('imageURL'),
      description: formData.get('description') || '',
      ownerId: formData.get('ownerId')
    };
    
    try {
      const res = await fetch(`${API_BASE_URL}/${encodeURIComponent(carId)}`, { 
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(carData)
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Update failed' }));
        throw new Error(errorData.error || 'Update failed');
      }
      
      const data = await res.json();
      alert('Car updated successfully!');
      editModal.classList.add('hidden');
      editForm.reset();
      loadAndRender();
    } catch (e) {
      console.error('Error updating car:', e);
      alert('Error updating car: ' + e.message);
    }
  });

  // Create Car handlers
  createBtn.addEventListener('click', () => {
    createForm.reset();
    createModal.classList.remove('hidden');
  });

  cancelCreate.addEventListener('click', () => {
    createForm.reset();
    createModal.classList.add('hidden');
  });

  document.getElementById('closeCreateModal')?.addEventListener('click', () => {
    createForm.reset();
    createModal.classList.add('hidden');
  });

  createModal.addEventListener('click', (e) => {
    if (e.target === createModal) {
      createForm.reset();
      createModal.classList.add('hidden');
    }
  });

  createForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    
    const formData = new FormData(createForm);
    
    // Convert FormData to JSON object
    const carData = {
      carName: formData.get('carName'),
      brand: formData.get('brand'),
      modelYear: formData.get('modelYear'),
      priceRent: parseFloat(formData.get('priceRent')),
      priceBuy: parseFloat(formData.get('priceBuy')),
      status: formData.get('status'),
      imageURL: formData.get('imageURL'),
      description: formData.get('description') || '',
      ownerId: formData.get('ownerId')
    };
    
    try {
      const res = await fetch(API_BASE_URL, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(carData)
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Create failed' }));
        throw new Error(errorData.error || 'Create failed');
      }
      
      const data = await res.json();
      alert('Car created successfully!');
      createForm.reset();
      createModal.classList.add('hidden');
      loadAndRender();
    } catch (e) {
      console.error('Error creating car:', e);
      alert('Error creating car: ' + e.message);
    }
  });

  // Edit Car handlers
  cancelEdit.addEventListener('click', () => editModal.classList.add('hidden'));
  document.getElementById('closeModal')?.addEventListener('click', () => editModal.classList.add('hidden'));
  
  // Close modal on background click
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
      const cars = await fetchCars(q);
      renderRows(cars);
    }, 300); // Wait 300ms after user stops typing
  });

  // Initial load
  loadAndRender();
});

