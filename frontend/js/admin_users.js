// Simple admin users UI script
document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.querySelector('#usersTable tbody');
  const searchInput = document.getElementById('searchInput');
  const refreshBtn = document.getElementById('refreshBtn');
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

  function openEdit(userId) {
    // In a real setup, fetch single user data from backend
    // For now pull from rendered table
    const row = [...tableBody.children].find(r => r.children[0].textContent === userId);
    if (!row) return;
    editForm.userId.value = row.children[0].textContent;
    editForm.fullname.value = row.children[1].textContent;
    editForm.email.value = row.children[2].textContent;
    editForm.role.value = row.children[4].textContent;
    editModal.classList.remove('hidden');
  }

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
    const formData = new FormData(editForm);
    const payload = Object.fromEntries(formData.entries());
    try {
      const res = await fetch(`../../backend/admin_users.php?action=update`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Save failed');
      alert('Saved');
      editModal.classList.add('hidden');
      loadAndRender();
    } catch (e) {
      // fallback: update the table row locally
      const row = [...tableBody.children].find(r => r.children[0].textContent === payload.userId);
      if (row) {
        row.children[1].textContent = payload.fullname;
        row.children[2].textContent = payload.email;
        row.children[4].textContent = payload.role;
      }
      editModal.classList.add('hidden');
      alert('Saved locally (backend not available)');
    }
  });

  cancelEdit.addEventListener('click', () => editModal.classList.add('hidden'));
  refreshBtn.addEventListener('click', loadAndRender);
  searchInput.addEventListener('input', async (e) => {
    const q = e.target.value.trim().toLowerCase();
    const users = await fetchUsers();
    const filtered = users.filter(u => (u.FullName || '').toLowerCase().includes(q) || (u.Email || '').toLowerCase().includes(q));
    renderRows(filtered);
  });

  loadAndRender();
});
