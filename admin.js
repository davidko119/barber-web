/* =============================================
   DON ADMIN — JavaScript (Vite + Convex)
   ============================================= */

import { ConvexClient } from "convex/browser";

// ─── Konfigurácia ─────────────────────────────
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "DON2026";
const CONVEX_URL     = import.meta.env.VITE_CONVEX_URL;
let api = null;

// ─── Elementy ─────────────────────────────────
const adminLogin     = document.getElementById('adminLogin');
const adminDashboard = document.getElementById('adminDashboard');
const loginForm      = document.getElementById('loginForm');
const loginError     = document.getElementById('loginError');
const logoutBtn      = document.getElementById('logoutBtn');
const bookingsBody   = document.getElementById('bookingsBody');
const refreshBtn     = document.getElementById('refreshBtn');
const statusDot      = document.getElementById('statusDot');
const statusText     = document.getElementById('statusText');
const searchInput    = document.getElementById('searchInput');
const filterTabs     = document.getElementById('filterTabs');
const deleteModal    = document.getElementById('deleteModal');
const modalCancel    = document.getElementById('modalCancel');
const modalConfirm   = document.getElementById('modalConfirm');
const sidebarLinks   = document.querySelectorAll('.sidebar-link');

let convex = null;
let allBookings   = [];
let activeFilter  = 'all';
let pendingDelete = null;
let unsubscribe   = null;

// Názvy služieb
const SERVICE_LABELS = {
  haircut:  'Haircut & Beard',
  skincare: 'Skincare & Oils',
  body:     'Body Treatment',
  shampoo:  'Shampoo & Styling',
};

// ─── Autentifikácia ────────────────────────────
function isLoggedIn() {
  return sessionStorage.getItem('donAdmin') === '1';
}

function showDashboard() {
  adminLogin.classList.add('hidden');
  adminDashboard.classList.remove('hidden');
  initConvex();
}

function showLogin() {
  adminLogin.classList.remove('hidden');
  adminDashboard.classList.add('hidden');
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
}

// Kontrola session pri načítaní
if (isLoggedIn()) {
  showDashboard();
} else {
  adminLogin.classList.remove('hidden');
}

// Login form
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const pwd = document.getElementById('adminPassword').value;
  if (pwd === ADMIN_PASSWORD) {
    sessionStorage.setItem('donAdmin', '1');
    loginError.classList.remove('show');
    showDashboard();
  } else {
    loginError.classList.add('show');
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminPassword').focus();
  }
});

// Odhlásiť
logoutBtn.addEventListener('click', () => {
  sessionStorage.removeItem('donAdmin');
  showLogin();
});

// ─── Convex inicializácia ──────────────────────
function initConvex() {
  if (!CONVEX_URL) {
    statusDot.className    = 'status-dot error';
    statusText.textContent = 'VITE_CONVEX_URL nie je nastavená';
    loadFallbackData();
    return;
  }

  convex = new ConvexClient(CONVEX_URL);

  // Načítaj API modul dynamicky (vygeneruje ho npx convex dev)
  import("./convex/_generated/api.js").then(mod => {
    api = mod.api;
    setStatus('connecting');

    // Real-time subscription na všetky rezervácie
    unsubscribe = convex.onUpdate(
      api.bookings.listBookings,
      {},
      (bookings) => {
        allBookings = bookings || [];
        setStatus('connected');
        renderAll();
      },
      (err) => {
        console.error('Convex chyba:', err);
        setStatus('error');
      }
    );
  }).catch(() => {
    console.warn("Convex _generated/api.js nie je k dispozícii. Spusti: npx convex dev");
    setStatus('error');
    loadFallbackData();
  });
}

// Fallback — localStorage (keď Convex nie je nakonfigurovaný)
function loadFallbackData() {
  allBookings = JSON.parse(localStorage.getItem('donBookings') || '[]')
    .map((b, i) => ({ ...b, _id: 'local_' + i }));
  renderAll();
}

function setStatus(state) {
  if (state === 'connecting') {
    statusDot.className    = 'status-dot';
    statusText.textContent = 'Pripájam…';
  } else if (state === 'connected') {
    statusDot.className    = 'status-dot connected';
    statusText.textContent = 'Živý prenos';
  } else if (state === 'error') {
    statusDot.className    = 'status-dot error';
    statusText.textContent = 'Chyba pripojenia';
  }
}

// ─── Render ────────────────────────────────────
function renderAll() {
  updateCounts();
  renderTable();
  renderStats();
}

function updateCounts() {
  const counts = { all: allBookings.length, pending: 0, confirmed: 0, cancelled: 0 };
  allBookings.forEach(b => { if (counts[b.status] !== undefined) counts[b.status]++; });
  document.getElementById('countAll').textContent       = counts.all;
  document.getElementById('countPending').textContent   = counts.pending;
  document.getElementById('countConfirmed').textContent = counts.confirmed;
  document.getElementById('countCancelled').textContent = counts.cancelled;

  // Stats view
  document.getElementById('statTotal').textContent     = counts.all;
  document.getElementById('statPending').textContent   = counts.pending;
  document.getElementById('statConfirmed').textContent = counts.confirmed;
  document.getElementById('statCancelled').textContent = counts.cancelled;
}

function getFilteredBookings() {
  const query = searchInput.value.toLowerCase().trim();
  return allBookings.filter(b => {
    const matchStatus = activeFilter === 'all' || b.status === activeFilter;
    const fullName    = `${b.firstName} ${b.lastName}`.toLowerCase();
    const matchSearch = !query || fullName.includes(query) || b.email.toLowerCase().includes(query);
    return matchStatus && matchSearch;
  });
}

function renderTable() {
  const filtered = getFilteredBookings();
  bookingsBody.innerHTML = '';

  if (filtered.length === 0) {
    bookingsBody.innerHTML = `
      <tr class="table-empty">
        <td colspan="9">
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <p>Žiadne rezervácie</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  filtered.forEach((b, i) => {
    const tr = document.createElement('tr');
    tr.dataset.id = b._id;

    const serviceLabel = SERVICE_LABELS[b.service] || b.service;
    const dateStr      = b.date ? formatDate(b.date) : '—';
    const phone        = b.phone || '—';
    const notes        = b.notes || '—';

    tr.innerHTML = `
      <td>${i + 1}</td>
      <td class="td-name">${esc(b.firstName)} ${esc(b.lastName)}</td>
      <td class="td-email">${esc(b.email)}</td>
      <td>${esc(phone)}</td>
      <td><span class="service-badge">${esc(serviceLabel)}</span></td>
      <td class="td-date">${dateStr}</td>
      <td class="td-notes" title="${esc(notes)}">${esc(notes)}</td>
      <td><span class="status-badge ${b.status}">${statusLabel(b.status)}</span></td>
      <td class="td-actions">
        ${b.status !== 'confirmed'  ? `<button class="action-btn confirm"  data-action="confirm"  data-id="${b._id}">Potvrdiť</button>` : ''}
        ${b.status !== 'cancelled'  ? `<button class="action-btn cancel"   data-action="cancel"   data-id="${b._id}">Zrušiť</button>` : ''}
        <button class="action-btn delete" data-action="delete" data-id="${b._id}">Vymazať</button>
      </td>`;

    bookingsBody.appendChild(tr);
  });

  // Event delegácia na akcie
  bookingsBody.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', handleAction);
  });
}

function renderStats() {
  const serviceCount = {};
  allBookings.forEach(b => {
    serviceCount[b.service] = (serviceCount[b.service] || 0) + 1;
  });

  const sorted  = Object.entries(serviceCount).sort((a, b) => b[1] - a[1]);
  const maxCount = sorted[0]?.[1] || 1;
  const container = document.getElementById('servicesList');
  container.innerHTML = '';

  sorted.forEach(([service, count]) => {
    const label = SERVICE_LABELS[service] || service;
    const pct   = (count / maxCount) * 100;
    container.innerHTML += `
      <div class="service-row">
        <span class="service-row-name">${esc(label)}</span>
        <div class="service-row-bar-wrap">
          <div class="service-row-bar" style="width:${pct}%"></div>
        </div>
        <span class="service-row-count">${count}</span>
      </div>`;
  });
}

// ─── Akcie ─────────────────────────────────────
async function handleAction(e) {
  const btn    = e.currentTarget;
  const action = btn.dataset.action;
  const id     = btn.dataset.id;

  if (action === 'delete') {
    pendingDelete = id;
    deleteModal.classList.remove('hidden');
    return;
  }

  const newStatus = action === 'confirm' ? 'confirmed' : 'cancelled';
  await changeStatus(id, newStatus);
}

async function changeStatus(id, status) {
  try {
    if (convex && api && !id.startsWith('local_')) {
      await convex.mutation(api.bookings.updateStatus, { id, status });
    } else {
      // Fallback localStorage
      const stored = JSON.parse(localStorage.getItem('donBookings') || '[]');
      const idx    = parseInt(id.replace('local_', ''));
      if (stored[idx]) { stored[idx].status = status; localStorage.setItem('donBookings', JSON.stringify(stored)); }
      loadFallbackData();
    }
  } catch (err) {
    console.error('Chyba pri zmene statusu:', err);
    alert('Chyba: ' + err.message);
  }
}

// Delete modal
modalCancel.addEventListener('click', () => {
  deleteModal.classList.add('hidden');
  pendingDelete = null;
});

modalConfirm.addEventListener('click', async () => {
  if (!pendingDelete) return;
  deleteModal.classList.add('hidden');

  try {
    if (convex && api && !pendingDelete.startsWith('local_')) {
      await convex.mutation(api.bookings.deleteBooking, { id: pendingDelete });
    } else {
      const stored = JSON.parse(localStorage.getItem('donBookings') || '[]');
      const idx    = parseInt(pendingDelete.replace('local_', ''));
      stored.splice(idx, 1);
      localStorage.setItem('donBookings', JSON.stringify(stored));
      loadFallbackData();
    }
  } catch (err) {
    console.error('Chyba pri mazaní:', err);
    alert('Chyba: ' + err.message);
  }
  pendingDelete = null;
});

// ─── Filter tabs ───────────────────────────────
filterTabs.querySelectorAll('.filter-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    filterTabs.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeFilter = tab.dataset.status;
    renderTable();
  });
});

// Search
searchInput.addEventListener('input', () => renderTable());

// Refresh
refreshBtn.addEventListener('click', () => {
  refreshBtn.classList.add('spinning');
  setTimeout(() => refreshBtn.classList.remove('spinning'), 600);
  if (!convex) loadFallbackData();
});

// ─── Sidebar navigácia (Rezervácie / Štatistiky) ──
sidebarLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    sidebarLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    const view = link.dataset.view;
    const tableWrap  = document.querySelector('.table-wrap');
    const statsView  = document.getElementById('statsView');
    const adminTitle = document.querySelector('.admin-title');
    const adminFilters = document.querySelector('.admin-filters');

    if (view === 'bookings') {
      tableWrap.classList.remove('hidden');
      adminFilters.classList.remove('hidden');
      statsView.classList.add('hidden');
      adminTitle.textContent = 'Rezervácie';
    } else {
      tableWrap.classList.add('hidden');
      adminFilters.classList.add('hidden');
      statsView.classList.remove('hidden');
      adminTitle.textContent = 'Štatistiky';
    }
  });
});

// ─── Pomocné funkcie ───────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('sk-SK', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return dateStr; }
}

function statusLabel(status) {
  return { pending: 'Čaká', confirmed: 'Potvrdená', cancelled: 'Zrušená' }[status] || status;
}
