// Admin users UI script
document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.querySelector('#usersTable tbody');
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
  const API_BASE_URL = 'http://localhost:3000/api/admin/users';

  async function fetchUsers(searchQuery = '') {
    try {
      const url = searchQuery 
        ? `${API_BASE_URL}?search=${encodeURIComponent(searchQuery)}`
        : API_BASE_URL;
      
      const res = await fetch(url);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to fetch users' }));
        throw new Error(errorData.error || 'Failed to fetch users');
      }
      const data = await res.json();
      return data.users || [];
    } catch (e) {
      console.error('Error fetching users:', e);
      alert('Error loading users: ' + e.message);
      return [];
    }
  }

  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  function getRoleBadgeClass(role) {
    const roleLower = (role || '').toLowerCase();
    if (roleLower === 'admin') return 'admin';
    if (roleLower === 'owner') return 'owner';
    if (roleLower === 'user') return 'user';
    return 'user';
  }

  function renderRows(users) {
    tableBody.innerHTML = '';
    if (users.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--gray-600);">No users found</td></tr>';
      return;
    }
    
    users.forEach(user => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${user.UserId || ''}</td>
        <td>
          <div class="user-cell" style="display:flex;gap:12px;align-items:center;">
            <img src="${user.AvatarURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.FullName || '')}&background=5046e5&color=fff`}" 
                 alt="${user.FullName || ''}" 
                 style="width:36px;height:36px;border-radius:50%;object-fit:cover;" 
                 onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.FullName || '')}&background=5046e5&color=fff';" />
            <div>
              <div class="user-name" style="font-weight:600;">${user.FullName || ''}</div>
              <div class="user-meta" style="font-size:12px;color:var(--gray-600);">${user.OwnedCarsCount || 0} cars • ${user.TotalContractsCount || 0} contracts</div>
            </div>
          </div>
        </td>
        <td>${user.Email || ''}</td>
        <td>${user.WalletAddress || ''}</td>
        <td>
          <span class="role-badge ${getRoleBadgeClass(user.Role)}" style="display:inline-block;padding:4px 12px;border-radius:999px;font-size:13px;font-weight:600;text-transform:capitalize;">
            ${(user.Role || 'user').charAt(0).toUpperCase() + (user.Role || 'user').slice(1)}
          </span>
        </td>
        <td>${user.CreatedAt || ''}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-edit" data-action="edit" data-id="${user.UserId}">Edit</button>
            <button class="btn btn-delete" data-action="delete" data-id="${user.UserId}">Delete</button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });
    
    updateSummary(users);
  }

  function updateSummary(users) {
    const total = users.length;
    const owners = users.filter(u => (u.Role || '').toLowerCase() === 'owner').length;
    const admins = users.filter(u => (u.Role || '').toLowerCase() === 'admin').length;
    const regularUsers = users.filter(u => (u.Role || '').toLowerCase() === 'user').length;
    const withWallet = users.filter(u => !!u.WalletAddress).length;

    // Update summary numbers
    document.getElementById('totalUsersCount').textContent = total;
    document.getElementById('ownersCount').textContent = owners;
    document.getElementById('adminsCount').textContent = admins;
    document.getElementById('withWalletCount').textContent = withWallet;

    // Update role distribution bars and percentages
    if (total > 0) {
      const ownerPercent = Math.round((owners / total) * 100);
      const adminPercent = Math.round((admins / total) * 100);
      const userPercent = Math.round((regularUsers / total) * 100);

      // Update progress bars
      document.getElementById('ownerBar').style.width = ownerPercent + '%';
      document.getElementById('adminBar').style.width = adminPercent + '%';
      document.getElementById('userBar').style.width = userPercent + '%';

      // Update percentage text
      document.getElementById('ownerPercent').textContent = ownerPercent + '%';
      document.getElementById('adminPercent').textContent = adminPercent + '%';
      document.getElementById('userPercent').textContent = userPercent + '%';
    } else {
      // Reset bars if no users
      ['ownerBar', 'adminBar', 'userBar'].forEach(id => {
        document.getElementById(id).style.width = '0%';
      });
      ['ownerPercent', 'adminPercent', 'userPercent'].forEach(id => {
        document.getElementById(id).textContent = '0%';
      });
    }
  }

  // Quick action functions
  window.filterByRole = async function(role) {
    searchInput.value = ''; // Clear search
    const users = await fetchUsers();
    const filtered = users.filter(u => (u.Role || '').toLowerCase() === role.toLowerCase());
    renderRows(filtered);
    updateSummary(filtered);
  };

  window.exportUsers = async function() {
    try {
      const users = await fetchUsers();
      const csvContent = generateCSV(users);
      downloadCSV(csvContent, 'users_export.csv');
    } catch (e) {
      alert('Error exporting users: ' + e.message);
    }
  };

  function generateCSV(users) {
    const headers = ['User ID', 'Full Name', 'Email', 'Role', 'Wallet Address', 'Owned Cars', 'Total Contracts', 'Created At'];
    const rows = users.map(user => [
      user.UserId || '',
      user.FullName || '',
      user.Email || '',
      user.Role || '',
      user.WalletAddress || '',
      user.OwnedCarsCount || 0,
      user.TotalContractsCount || 0,
      user.CreatedAt || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function loadAndRender() {
    const users = await fetchUsers();
    renderRows(users);
  }

  tableBody.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (action === 'edit') openEdit(id);
    if (action === 'delete') doDelete(id);
  });

  async function openEdit(userId) {
    try {
      // Fetch full user data from backend
      const res = await fetch(`${API_BASE_URL}/${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          populateEditForm(data.user);
          editModal.classList.remove('hidden');
          return;
        }
      } else {
        const errorData = await res.json().catch(() => ({ error: 'User not found' }));
        throw new Error(errorData.error || 'Failed to fetch user');
      }
    } catch (e) {
      console.error('Error fetching user:', e);
      alert('Error loading user: ' + e.message);
    }
  }

  function populateEditForm(user) {
    document.getElementById('userId').value = user.UserId || '';
    document.getElementById('fullname').value = user.FullName || '';
    document.getElementById('email').value = user.Email || '';
    document.getElementById('role').value = (user.Role || 'user').toLowerCase();
    document.getElementById('walletAddress').value = user.WalletAddress || '';
    document.getElementById('createdAt').value = formatDate(user.CreatedAt) || '';
    
    // Load wallets if available
    renderWallets(Array.isArray(user.Wallets) ? user.Wallets : []);
    
    // Load related stats
    document.getElementById('ownedCarsCount').textContent = user.OwnedCarsCount || 0;
    document.getElementById('activeContractsCount').textContent = user.ActiveContractsCount || 0;
    document.getElementById('totalContractsCount').textContent = user.TotalContractsCount || 0;
  }

  function renderWallets(wallets) {
    const container = document.getElementById('walletsContainer');
    if (!container) return;
    
    if (!wallets || wallets.length === 0) {
      container.innerHTML = '<p style="color: var(--gray-600); font-size: 13px; padding: 12px;">No wallets connected</p>';
      return;
    }
    
    container.innerHTML = wallets.map(wallet => `
      <div class="wallet-item" style="padding:10px;border:1px solid var(--gray-100);border-radius:10px;display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div>
          <div class="wallet-address" style="font-weight:600;">${wallet.WalletAddress || ''}</div>
          <div class="wallet-network" style="font-size:12px;color:var(--gray-600);">${wallet.NetWork || 'Unknown Network'} • ${wallet.LastConnected || ''}</div>
        </div>
        <div class="wallet-actions">
          <button type="button" class="btn-link" onclick="removeWallet('${wallet.WalletId}')">Remove</button>
        </div>
      </div>
    `).join('');
  }

  window.viewUserCars = function() {
    const userId = document.getElementById('userId').value;
    // TODO: Navigate to cars page filtered by user
    alert('View user cars - User ID: ' + userId);
  };

  window.viewUserContracts = function() {
    const userId = document.getElementById('userId').value;
    // TODO: Navigate to contracts page filtered by user
    alert('View user contracts - User ID: ' + userId);
  };

  window.removeWallet = function(walletId) {
    if (!confirm('Remove this wallet?')) return;
    // TODO: Call backend to remove wallet
    console.log('Remove wallet:', walletId);
  };

  async function doDelete(userId) {
    if (!confirm('Delete user ' + userId + '? This action cannot be undone.')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/${encodeURIComponent(userId)}`, { 
        method: 'DELETE'
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Delete failed' }));
        throw new Error(errorData.error || 'Delete failed');
      }
      
      const data = await res.json();
      alert('User deleted successfully!');
      loadAndRender();
    } catch (e) {
      console.error('Error deleting user:', e);
      alert('Error deleting user: ' + e.message);
    }
  }

  editForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    
    // Validate passwords if provided
    const newPassword = document.getElementById('newPassword')?.value || '';
    const confirmPassword = document.getElementById('confirmPassword')?.value || '';
    if (newPassword && newPassword !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    
    const formData = new FormData(editForm);
    const userId = formData.get('userId');
    
    // Convert FormData to JSON object
    const userData = {
      userId: userId,
      fullname: formData.get('fullname'),
      email: formData.get('email'),
      role: formData.get('role'),
      walletAddress: formData.get('walletAddress') || ''
    };
    
    // Add password if provided
    if (newPassword) {
      userData.password = newPassword;
    }
    
    try {
      const res = await fetch(`${API_BASE_URL}/${encodeURIComponent(userId)}`, { 
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Update failed' }));
        throw new Error(errorData.error || 'Update failed');
      }
      
      const data = await res.json();
      alert('User updated successfully!');
      editModal.classList.add('hidden');
      editForm.reset();
      loadAndRender();
    } catch (e) {
      console.error('Error updating user:', e);
      alert('Error updating user: ' + e.message);
    }
  });

  // Create User handlers
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
    
    const password = document.getElementById('createPassword')?.value || '';
    const confirmPassword = document.getElementById('createConfirmPassword')?.value || '';
    
    // Validate passwords
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    
    if (password.length < 6) {
      alert('Password must be at least 6 characters!');
      return;
    }
    
    const formData = new FormData(createForm);
    
    // Convert FormData to JSON object
    const userData = {
      fullname: formData.get('fullname'),
      email: formData.get('email'),
      password: formData.get('password'),
      role: formData.get('role'),
      walletAddress: formData.get('walletAddress') || ''
    };
    
    try {
      const res = await fetch(API_BASE_URL, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Create failed' }));
        throw new Error(errorData.error || 'Create failed');
      }
      
      const data = await res.json();
      alert('User created successfully!');
      createForm.reset();
      createModal.classList.add('hidden');
      loadAndRender();
    } catch (e) {
      console.error('Error creating user:', e);
      alert('Error creating user: ' + e.message);
    }
  });

  // Edit User handlers
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
      const users = await fetchUsers(q);
      renderRows(users);
    }, 300); // Wait 300ms after user stops typing
  });

  // Initial load
  loadAndRender();
});
