// Simple admin users UI script
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

  const API_BASE_URL = 'http://localhost:3000/api/admin/users';

  // ----------------------------
  // FALLBACK DATA FROM DATABASE DUMP
  // ----------------------------
  const FALLBACK_USERS = [
    { UserId: 'U001', FullName: 'Nguyen Van A', Email: 'a@example.com', Role: 'Owner', WalletAddress: '0xABC...', AvatarURL: null, CreatedAt: '2025-11-12 22:32:18' },
    { UserId: 'U002', FullName: 'Nguyen Van B', Email: 'b@example.com', Role: 'Owner', WalletAddress: '0xDEF...', AvatarURL: null, CreatedAt: '2025-11-12 22:32:18' },
    { UserId: 'U003', FullName: 'Nguyen Van C', Email: 'c@example.com', Role: 'Owner', WalletAddress: '0xGHI...', AvatarURL: null, CreatedAt: '2025-11-12 22:32:18' },
    { UserId: 'U004', FullName: 'Nguyen Van D', Email: 'd@example.com', Role: 'Owner', WalletAddress: '0xJKL...', AvatarURL: null, CreatedAt: '2025-11-12 22:32:18' },
    { UserId: 'U005', FullName: 'Nguyen Van E', Email: 'e@example.com', Role: 'Owner', WalletAddress: '0xMNO...', AvatarURL: null, CreatedAt: '2025-11-12 22:32:18' },
    { UserId: 'U006', FullName: 'Nguyen Van F', Email: 'f@example.com', Role: 'Owner', WalletAddress: '0xPQR...', AvatarURL: null, CreatedAt: '2025-11-12 22:32:18' },
    { UserId: 'U007', FullName: 'Nguyen Van G', Email: 'g@example.com', Role: 'Owner', WalletAddress: '0xSTU...', AvatarURL: null, CreatedAt: '2025-11-12 22:32:18' },
    { UserId: 'U008', FullName: 'Nguyen Van H', Email: 'h@example.com', Role: 'Owner', WalletAddress: '0xVWX...', AvatarURL: null, CreatedAt: '2025-11-12 22:32:18' },
    { UserId: 'U009', FullName: 'Nguyen Van I', Email: 'i@example.com', Role: 'Owner', WalletAddress: '0xYZA...', AvatarURL: null, CreatedAt: '2025-11-12 22:32:18' },
    { UserId: 'U010', FullName: 'Nguyen Van J', Email: 'j@example.com', Role: 'Owner', WalletAddress: '0xBCD...', AvatarURL: null, CreatedAt: '2025-11-12 22:32:18' }
  ];

  const FALLBACK_WALLETS = [
    { WalletId: 'W001', UserId: 'U001', WalletAddress: '0xABC...', NetWork: 'Polygon', LastConnected: '2025-11-12 22:40:00' },
    { WalletId: 'W002', UserId: 'U002', WalletAddress: '0xDEF...', NetWork: 'Polygon', LastConnected: '2025-11-12 22:41:00' },
    { WalletId: 'W003', UserId: 'U003', WalletAddress: '0xGHI...', NetWork: 'Polygon', LastConnected: '2025-11-12 22:42:00' },
    { WalletId: 'W004', UserId: 'U004', WalletAddress: '0xJKL...', NetWork: 'Polygon', LastConnected: '2025-11-12 22:43:00' },
    { WalletId: 'W005', UserId: 'U005', WalletAddress: '0xMNO...', NetWork: 'Polygon', LastConnected: '2025-11-12 22:44:00' },
    { WalletId: 'W006', UserId: 'U006', WalletAddress: '0xPQR...', NetWork: 'Polygon', LastConnected: '2025-11-12 22:45:00' },
    { WalletId: 'W007', UserId: 'U007', WalletAddress: '0xSTU...', NetWork: 'Polygon', LastConnected: '2025-11-12 22:46:00' },
    { WalletId: 'W008', UserId: 'U008', WalletAddress: '0xVWX...', NetWork: 'Polygon', LastConnected: '2025-11-12 22:47:00' },
    { WalletId: 'W009', UserId: 'U009', WalletAddress: '0xYZA...', NetWork: 'Polygon', LastConnected: '2025-11-12 22:48:00' },
    { WalletId: 'W010', UserId: 'U010', WalletAddress: '0xBCD...', NetWork: 'Polygon', LastConnected: '2025-11-12 22:49:00' }
  ];

  const FALLBACK_CONTRACTS = [
    { ContractId: 'CT01', CarId: 'C001', UserId: 'U003', Type: 'Rent', Status: 'Completed', StartDate: '2025-10-01', EndDate: '2025-10-05' },
    { ContractId: 'CT02', CarId: 'C002', UserId: 'U004', Type: 'Rent', Status: 'Pending', StartDate: '2025-11-01', EndDate: '2025-11-03' },
    { ContractId: 'CT03', CarId: 'C003', UserId: 'U005', Type: 'Rent', Status: 'Completed', StartDate: '2025-09-15', EndDate: '2025-09-18' },
    { ContractId: 'CT04', CarId: 'C004', UserId: 'U006', Type: 'Buy', Status: 'Completed', StartDate: '2025-08-20', EndDate: '2025-08-20' },
    { ContractId: 'CT05', CarId: 'C005', UserId: 'U007', Type: 'Buy', Status: 'Pending', StartDate: '2025-10-12', EndDate: '2025-10-12' }
  ];

  const FALLBACK_CARS = [
    { CarId: 'C001', OwnerId: 'U001' }, { CarId: 'C002', OwnerId: 'U002' }, { CarId: 'C003', OwnerId: 'U003' },
    { CarId: 'C004', OwnerId: 'U004' }, { CarId: 'C005', OwnerId: 'U005' }, { CarId: 'C006', OwnerId: 'U006' },
    { CarId: 'C007', OwnerId: 'U007' }, { CarId: 'C008', OwnerId: 'U008' }, { CarId: 'C009', OwnerId: 'U009' },
    { CarId: 'C010', OwnerId: 'U010' }, { CarId: 'C011', OwnerId: 'U011' }, { CarId: 'C012', OwnerId: 'U012' },
    { CarId: 'C013', OwnerId: 'U013' }, { CarId: 'C014', OwnerId: 'U014' }, { CarId: 'C015', OwnerId: 'U015' },
    { CarId: 'C016', OwnerId: 'U016' }, { CarId: 'C017', OwnerId: 'U017' }, { CarId: 'C018', OwnerId: 'U018' },
    { CarId: 'C019', OwnerId: 'U019' }, { CarId: 'C020', OwnerId: 'U020' }, { CarId: 'C021', OwnerId: 'U002' },
    { CarId: 'C022', OwnerId: 'U004' }, { CarId: 'C023', OwnerId: 'U006' }, { CarId: 'C024', OwnerId: 'U006' },
    { CarId: 'C025', OwnerId: 'U005' }, { CarId: 'C026', OwnerId: 'U002' }, { CarId: 'C027', OwnerId: 'U008' },
    { CarId: 'C028', OwnerId: 'U004' }, { CarId: 'C029', OwnerId: 'U007' }, { CarId: 'C030', OwnerId: 'U004' }
  ];

  let usersCache = [];

  function generateLocalUserId() {
    const existingIds = new Set([
      ...FALLBACK_USERS.map(user => user.UserId),
      ...usersCache.map(user => user.UserId)
    ]);
    let counter = usersCache.length + FALLBACK_USERS.length + 1;
    let candidate = '';
    do {
      candidate = 'U' + String(counter).padStart(3, '0');
      counter += 1;
    } while (existingIds.has(candidate));
    return candidate;
  }

  function normalizeUser(record) {
    if (!record) return null;
    const stats = computeUserStats(record.UserId || record.userId);
    return {
      UserId: record.UserId || record.userId,
      FullName: record.FullName || record.fullname || record.fullName,
      Email: record.Email || record.email,
      WalletAddress: record.WalletAddress || record.walletAddress || '',
      Role: (record.Role || record.role || 'User').trim(),
      AvatarURL: record.AvatarURL || record.avatarURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(record.FullName || record.fullName || record.UserId || '')}&background=5046e5&color=fff`,
      CreatedAt: formatDate(record.CreatedAt || record.createdAt),
      OwnedCarsCount: record.OwnedCarsCount ?? record.ownedCarsCount ?? stats.OwnedCarsCount,
      ActiveContractsCount: record.ActiveContractsCount ?? record.activeContractsCount ?? stats.ActiveContractsCount,
      TotalContractsCount: record.TotalContractsCount ?? record.totalContractsCount ?? stats.TotalContractsCount,
      Wallets: record.Wallets || record.wallets || stats.Wallets
    };
  }

  function formatDate(value) {
    if (!value) return '';
    if (value instanceof Date) return value.toISOString().split('T')[0];
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString().split('T')[0];
    }
    if (value.includes('T')) return value.split('T')[0];
    if (value.includes(' ')) return value.split(' ')[0];
    return value;
  }

  function computeUserStats(userId) {
    const ownedCars = FALLBACK_CARS.filter(car => car.OwnerId === userId).length;
    const relatedContracts = FALLBACK_CONTRACTS.filter(contract => contract.UserId === userId);
    const activeContracts = relatedContracts.filter(contract => (contract.Status || '').toLowerCase() !== 'completed').length;
    const wallets = FALLBACK_WALLETS.filter(wallet => wallet.UserId === userId);

    return {
      OwnedCarsCount: ownedCars,
      TotalContractsCount: relatedContracts.length,
      ActiveContractsCount: activeContracts,
      Wallets: wallets
    };
  }

  function getFallbackUsers(searchQuery = '') {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    let data = FALLBACK_USERS;
    if (normalizedSearch) {
      data = data.filter(user => 
        (user.FullName || '').toLowerCase().includes(normalizedSearch) ||
        (user.Email || '').toLowerCase().includes(normalizedSearch) ||
        (user.UserId || '').toLowerCase().includes(normalizedSearch)
      );
    }
    return data.map(normalizeUser).filter(Boolean);
  }

  async function fetchUsers(searchQuery = '') {
    try {
      const url = searchQuery 
        ? `${API_BASE_URL}?search=${encodeURIComponent(searchQuery)}`
        : API_BASE_URL;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      const normalized = (data.users || []).map(normalizeUser).filter(Boolean);
      if (!normalized.length) throw new Error('Empty users');
      return normalized;
    } catch (e) {
      return getFallbackUsers(searchQuery);
    }
  }

  function renderRows(users) {
    tableBody.innerHTML = '';
    if (!users.length) {
      tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--gray-600);">No users found</td></tr>';
      return;
    }
    users.forEach(user => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${user.UserId}</td>
        <td>
          <div class="user-cell" style="display:flex;gap:12px;align-items:center;">
            <img src="${user.AvatarURL}" alt="${user.FullName}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;" onerror="this.src='https://i.pravatar.cc/40';" />
            <div>
              <div class="user-name" style="font-weight:600;">${user.FullName}</div>
              <div class="user-meta" style="font-size:12px;color:var(--gray-600);">${user.OwnedCarsCount || 0} cars • ${user.TotalContractsCount || 0} contracts</div>
            </div>
          </div>
        </td>
        <td>${user.Email}</td>
        <td>${user.WalletAddress || ''}</td>
        <td>
          <span style="display:inline-block;padding:4px 12px;border-radius:999px;font-size:13px;font-weight:600;text-transform:capitalize;background:var(--gray-100);color:var(--gray-700);">
            ${(user.Role || '').toLowerCase()}
          </span>
        </td>
        <td>${user.CreatedAt || ''}</td>
        <td>
          <div class="action-buttons">
            <button class="btn" data-action="edit" data-id="${user.UserId}">Edit</button>
            <button class="btn danger" data-action="delete" data-id="${user.UserId}">Delete</button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  function updateSummary(users) {
    const summaryCard = document.querySelector('.right-panel .card');
    if (!summaryCard) return;
    const totalUsers = users.length;
    const owners = users.filter(user => (user.Role || '').toLowerCase() === 'owner').length;
    const admins = users.filter(user => (user.Role || '').toLowerCase() === 'admin').length;
    const withWallet = users.filter(user => !!user.WalletAddress).length;

    summaryCard.innerHTML = `
      <h3>Users Summary</h3>
      <div class="summary-grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:12px;">
        <div class="summary-item" style="background:var(--gray-50);padding:12px;border-radius:12px;">
          <span class="summary-label" style="display:block;color:var(--gray-600);font-size:13px;">Total Users</span>
          <strong class="summary-value" style="font-size:22px;">${totalUsers}</strong>
        </div>
        <div class="summary-item" style="background:var(--gray-50);padding:12px;border-radius:12px;">
          <span class="summary-label" style="display:block;color:var(--gray-600);font-size:13px;">Owners</span>
          <strong class="summary-value" style="font-size:22px;">${owners}</strong>
        </div>
        <div class="summary-item" style="background:var(--gray-50);padding:12px;border-radius:12px;">
          <span class="summary-label" style="display:block;color:var(--gray-600);font-size:13px;">Admins</span>
          <strong class="summary-value" style="font-size:22px;">${admins}</strong>
        </div>
        <div class="summary-item" style="background:var(--gray-50);padding:12px;border-radius:12px;">
          <span class="summary-label" style="display:block;color:var(--gray-600);font-size:13px;">With Wallet</span>
          <strong class="summary-value" style="font-size:22px;">${withWallet}</strong>
        </div>
      </div>
    `;
  }

  async function loadAndRender(searchQuery = '') {
    const users = await fetchUsers(searchQuery);
    usersCache = users;
    renderRows(users);
    updateSummary(users);
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
      const res = await fetch(`${API_BASE_URL}/${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          populateEditForm(normalizeUser(data.user));
          editModal.classList.remove('hidden');
          return;
        }
      }
    } catch (e) {
      console.log('Backend not available, using table data');
    }
    
    // Fallback: pull from rendered table
    const userData = usersCache.find(user => user.UserId === userId);
    if (!userData) return;
    
    populateEditForm(userData);
    editModal.classList.remove('hidden');
  }

  function populateEditForm(user) {
    document.getElementById('userId').value = user.UserId || '';
    document.getElementById('fullname').value = user.FullName || '';
    document.getElementById('email').value = user.Email || '';
    document.getElementById('role').value = user.Role || 'user';
    document.getElementById('walletAddress').value = user.WalletAddress || '';
    document.getElementById('createdAt').value = user.CreatedAt || '';
    
    // Load wallets if available
    renderWallets(Array.isArray(user.Wallets) ? user.Wallets : []);
    
    // Load related stats
    document.getElementById('ownedCarsCount').textContent = user.OwnedCarsCount || 0;
    document.getElementById('activeContractsCount').textContent = user.ActiveContractsCount || 0;
    document.getElementById('totalContractsCount').textContent = user.TotalContractsCount || 0;
  }

  function renderWallets(wallets) {
    const container = document.getElementById('walletsContainer');
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
    if (!confirm('Delete user ' + userId + '?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/${encodeURIComponent(userId)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      alert('Deleted');
      loadAndRender();
    } catch (e) {
      usersCache = usersCache.filter(user => user.UserId !== userId);
      renderRows(usersCache);
      updateSummary(usersCache);
    }
  }

  editForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    
    // Validate passwords if provided
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    if (newPassword && newPassword !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    
    const formData = new FormData(editForm);
    const payload = Object.fromEntries(formData.entries());
    
    // Remove empty password fields
    if (!newPassword) {
      delete payload.newPassword;
      delete payload.confirmPassword;
    }
    
    try {
      const res = await fetch(`${API_BASE_URL}/${encodeURIComponent(payload.userId)}`, { 
        method: 'PUT', 
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Save failed');
      alert('User updated successfully!');
      editModal.classList.add('hidden');
      editForm.reset();
      loadAndRender();
    } catch (e) {
      usersCache = usersCache.map(user => {
        if (user.UserId !== payload.userId) return user;
        const updated = {
          ...user,
          FullName: payload.fullname,
          Email: payload.email,
          WalletAddress: payload.walletAddress || '',
          Role: payload.role
        };
        return updated;
      });
      renderRows(usersCache);
      updateSummary(usersCache);
      editModal.classList.add('hidden');
      editForm.reset();
      alert('Saved locally (backend not available)');
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
    
    const password = document.getElementById('createPassword').value;
    const confirmPassword = document.getElementById('createConfirmPassword').value;
    
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
    const payload = Object.fromEntries(formData.entries());
    delete payload.confirmPassword;
    
    try {
      const res = await fetch(`${API_BASE_URL}`, { 
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Create failed');
      alert('User created successfully!');
      createForm.reset();
      createModal.classList.add('hidden');
      loadAndRender();
    } catch (e) {
      // Fallback: add to table locally
      const newUser = {
        UserId: generateLocalUserId(),
        FullName: payload.fullname,
        Email: payload.email,
        WalletAddress: payload.walletAddress || '',
        Role: payload.role,
        CreatedAt: new Date().toISOString()
      };
      
      usersCache = [...usersCache, normalizeUser(newUser)];
      renderRows(usersCache);
      updateSummary(usersCache);
      
      createForm.reset();
      createModal.classList.add('hidden');
      alert('User created locally (backend not available)');
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

  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    const filtered = usersCache.filter(user => 
      (user.FullName || '').toLowerCase().includes(q) ||
      (user.Email || '').toLowerCase().includes(q) ||
      (user.UserId || '').toLowerCase().includes(q)
    );
    renderRows(filtered);
    updateSummary(filtered);
  });

  loadAndRender();
});
