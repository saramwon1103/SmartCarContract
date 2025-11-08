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

  async function fetchCars() {
    try {
      const res = await fetch('../../backend/admin_cars.php?action=list');
      if (!res.ok) throw new Error('No backend');
      const data = await res.json();
      return data.cars || [];
    } catch (e) {
      // fallback sample data when backend not present
      return [
        { 
          CarId: 'C001', 
          CarName: 'Nissan GT-R', 
          Brand: 'Nissan', 
          ModelYear: '2020-01-01', 
          PriceRent: 80.00, 
          PriceBuy: 120000.00, 
          Status: 'available',
          ImageURL: 'https://cdn.motor1.com/images/mgl/8xEJJ/s3/nissan-gt-r.jpg',
          Description: 'Sports car with the best design and acceleration',
          OwnerId: 'U001'
        },
        { 
          CarId: 'C002', 
          CarName: 'Koenigsegg', 
          Brand: 'Koenigsegg', 
          ModelYear: '2021-01-01', 
          PriceRent: 99.00, 
          PriceBuy: 150000.00, 
          Status: 'rented',
          ImageURL: 'https://cdn.motor1.com/images/mgl/8jjq1/s3/koenigsegg.jpg',
          Description: 'Luxury supercar',
          OwnerId: 'U002'
        },
      ];
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
      // Try to fetch full car data from backend
      const res = await fetch(`../../backend/admin_cars.php?action=get&carId=${encodeURIComponent(carId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.car) {
          populateEditForm(data.car);
          editModal.classList.remove('hidden');
          return;
        }
      }
    } catch (e) {
      console.log('Backend not available, using table data');
    }
    
    // Fallback: pull from rendered table
    const row = [...tableBody.children].find(r => r.children[0].textContent === carId);
    if (!row) return;
    
    const carData = {
      CarId: row.children[0].textContent,
      CarName: row.children[2].textContent,
      Brand: row.children[3].textContent,
      ModelYear: row.children[4].textContent,
      PriceRent: row.children[5].textContent.replace('$', ''),
      PriceBuy: row.children[6].textContent.replace('$', ''),
      Status: row.children[7].querySelector('.status-badge')?.textContent.toLowerCase() || 'available',
      ImageURL: row.children[1].querySelector('img')?.src || '',
      Description: '', // Description not shown in table
      OwnerId: row.children[8].textContent
    };
    
    populateEditForm(carData);
    editModal.classList.remove('hidden');
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
      const res = await fetch(`../../backend/admin_cars.php?action=delete&carId=${encodeURIComponent(carId)}`, { method: 'POST' });
      if (!res.ok) throw new Error('Delete failed');
      alert('Car deleted successfully!');
      loadAndRender();
    } catch (e) {
      // fallback: remove row locally
      const row = [...tableBody.children].find(r => r.children[0].textContent === carId);
      if (row) row.remove();
      alert('Deleted locally (backend not available)');
      loadAndRender();
    }
  }

  editForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    
    const formData = new FormData(editForm);
    
    try {
      const res = await fetch(`../../backend/admin_cars.php?action=update`, { 
        method: 'POST', 
        body: formData 
      });
      if (!res.ok) throw new Error('Save failed');
      alert('Car updated successfully!');
      editModal.classList.add('hidden');
      editForm.reset();
      loadAndRender();
    } catch (e) {
      // fallback: update the table row locally
      const payload = Object.fromEntries(formData.entries());
      const row = [...tableBody.children].find(r => r.children[0].textContent === payload.carId);
      if (row) {
        row.children[2].textContent = payload.carName;
        row.children[3].textContent = payload.brand;
        row.children[4].textContent = formatDate(payload.modelYear);
        row.children[5].textContent = formatPrice(payload.priceRent);
        row.children[6].textContent = formatPrice(payload.priceBuy);
        row.children[7].innerHTML = `<span class="status-badge ${getStatusBadgeClass(payload.status)}">${payload.status.charAt(0).toUpperCase() + payload.status.slice(1)}</span>`;
        row.children[8].textContent = payload.ownerId;
        if (payload.imageURL) {
          const img = row.children[1].querySelector('img');
          if (img) img.src = payload.imageURL;
        }
      }
      editModal.classList.add('hidden');
      editForm.reset();
      alert('Saved locally (backend not available)');
      loadAndRender();
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
    
    try {
      const res = await fetch(`../../backend/admin_cars.php?action=create`, { 
        method: 'POST', 
        body: formData 
      });
      if (!res.ok) throw new Error('Create failed');
      alert('Car created successfully!');
      createForm.reset();
      createModal.classList.add('hidden');
      loadAndRender();
    } catch (e) {
      // Fallback: add to table locally
      const payload = Object.fromEntries(formData.entries());
      const newCar = {
        CarId: 'C' + String(Math.floor(Math.random() * 1000)).padStart(3, '0'),
        CarName: payload.carName,
        Brand: payload.brand,
        ModelYear: payload.modelYear,
        PriceRent: parseFloat(payload.priceRent),
        PriceBuy: parseFloat(payload.priceBuy),
        Status: payload.status,
        ImageURL: payload.imageURL,
        Description: payload.description || '',
        OwnerId: payload.ownerId
      };
      
      const cars = await fetchCars();
      cars.push(newCar);
      renderRows(cars);
      
      createForm.reset();
      createModal.classList.add('hidden');
      alert('Car created locally (backend not available)');
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
  
  refreshBtn.addEventListener('click', loadAndRender);
  searchInput.addEventListener('input', async (e) => {
    const q = e.target.value.trim().toLowerCase();
    const cars = await fetchCars();
    const filtered = cars.filter(c => 
      (c.CarName || '').toLowerCase().includes(q) || 
      (c.Brand || '').toLowerCase().includes(q) ||
      (c.CarId || '').toLowerCase().includes(q)
    );
    renderRows(filtered);
  });

  loadAndRender();
});

