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

  async function fetchUsers() {
    try {
      const res = await fetch('../../backend/admin_users.php?action=list');
      if (!res.ok) throw new Error('No backend');
      const data = await res.json();
      return data.users || [];
    } catch (e) {
      // fallback sample data when backend not present
      return [
        { UserId: 'U001', FullName: 'Alice Nguyen', Email: 'alice@example.com', WalletAddress: '0xabc..1', Role: 'admin', CreatedAt: '2024-09-10' },
        { UserId: 'U002', FullName: 'Bob Tran', Email: 'bob@example.com', WalletAddress: '0xabc..2', Role: 'user', CreatedAt: '2024-10-01' },
      ];
    }
  }

  function renderRows(users) {
    tableBody.innerHTML = '';
    users.forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${u.UserId}</td>
        <td>${u.FullName}</td>
        <td>${u.Email}</td>
        <td>${u.WalletAddress || ''}</td>
        <td>${u.Role}</td>
        <td>${u.CreatedAt || ''}</td>
        <td>
          <button class="btn" data-action="edit" data-id="${u.UserId}">Edit</button>
          <button class="btn danger" data-action="delete" data-id="${u.UserId}">Delete</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });
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
      // Try to fetch full user data from backend
      const res = await fetch(`../../backend/admin_users.php?action=get&userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          populateEditForm(data.user);
          editModal.classList.remove('hidden');
          return;
        }
      }
    } catch (e) {
      console.log('Backend not available, using table data');
    }
    
    // Fallback: pull from rendered table
    const row = [...tableBody.children].find(r => r.children[0].textContent === userId);
    if (!row) return;
    
    const userData = {
      UserId: row.children[0].textContent,
      FullName: row.children[1].textContent,
      Email: row.children[2].textContent,
      WalletAddress: row.children[3].textContent || '',
      Role: row.children[4].textContent,
      CreatedAt: row.children[5].textContent || ''
    };
    
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
    if (user.Wallets && Array.isArray(user.Wallets)) {
      renderWallets(user.Wallets);
    } else {
      renderWallets([]);
    }
    
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
      <div class="wallet-item">
        <div>
          <div class="wallet-address">${wallet.WalletAddress || ''}</div>
          <div class="wallet-network">${wallet.NetWork || 'Unknown Network'}</div>
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
      const res = await fetch(`../../backend/admin_users.php?action=delete&userId=${encodeURIComponent(userId)}`, { method: 'POST' });
      if (!res.ok) throw new Error('Delete failed');
      alert('Deleted');
      loadAndRender();
    } catch (e) {
      // fallback: remove row locally
      const row = [...tableBody.children].find(r => r.children[0].textContent === userId);
      if (row) row.remove();
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
      formData.delete('newPassword');
      formData.delete('confirmPassword');
    }
    
    try {
      const res = await fetch(`../../backend/admin_users.php?action=update`, { 
        method: 'POST', 
        body: formData 
      });
      if (!res.ok) throw new Error('Save failed');
      alert('User updated successfully!');
      editModal.classList.add('hidden');
      editForm.reset();
      loadAndRender();
    } catch (e) {
      // fallback: update the table row locally
      const row = [...tableBody.children].find(r => r.children[0].textContent === payload.userId);
      if (row) {
        row.children[1].textContent = payload.fullname;
        row.children[2].textContent = payload.email;
        row.children[3].textContent = payload.walletAddress || '';
        row.children[4].textContent = payload.role;
      }
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
    
    try {
      const res = await fetch(`../../backend/admin_users.php?action=create`, { 
        method: 'POST', 
        body: formData 
      });
      if (!res.ok) throw new Error('Create failed');
      alert('User created successfully!');
      createForm.reset();
      createModal.classList.add('hidden');
      loadAndRender();
    } catch (e) {
      // Fallback: add to table locally
      const payload = Object.fromEntries(formData.entries());
      const newUser = {
        UserId: 'U' + String(Math.floor(Math.random() * 1000)).padStart(3, '0'),
        FullName: payload.fullname,
        Email: payload.email,
        WalletAddress: payload.walletAddress || '',
        Role: payload.role,
        CreatedAt: new Date().toISOString().split('T')[0]
      };
      
      const users = await fetchUsers();
      users.push(newUser);
      renderRows(users);
      
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
  
  refreshBtn.addEventListener('click', loadAndRender);
  searchInput.addEventListener('input', async (e) => {
    const q = e.target.value.trim().toLowerCase();
    const users = await fetchUsers();
    const filtered = users.filter(u => (u.FullName || '').toLowerCase().includes(q) || (u.Email || '').toLowerCase().includes(q));
    renderRows(filtered);
  });

  loadAndRender();
});
