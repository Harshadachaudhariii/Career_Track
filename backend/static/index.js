// ==================== CONFIG ====================
const API_BASE = "http://127.0.0.1:8000";
let applicationsState = {};
let activeFilter = "All";
// ==================== FLOATING PARTICLES ====================
(function initParticles() {
    const canvas = document.getElementById('particles');
    const ctx = canvas.getContext('2d');
    let particles = [];
    const COLORS = ['109,140,255', '184,111,232', '217,70,239', '66,217,208'];
    function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
    resize();
    addEventListener('resize', resize);
    for (let i = 0; i < 45; i++) {
        particles.push({
            x: Math.random() * innerWidth, y: Math.random() * innerHeight,
            r: Math.random() * 1.8 + 0.4,
            vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
            c: COLORS[Math.floor(Math.random() * COLORS.length)],
            a: Math.random() * 0.4 + 0.1
        });
    }
    function tick() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const p of particles) {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.c},${p.a})`;
            ctx.fill();
        }
        requestAnimationFrame(tick);
    }
    tick();
})();

// ==================== AMBIENT ORB DRIFT (mouse parallax) ====================
const orbs = document.querySelectorAll('.bg-orb');
document.addEventListener('mousemove', e => {
    const x = (e.clientX / innerWidth - 0.5), y = (e.clientY / innerHeight - 0.5);
    orbs.forEach((orb, i) => {
        const depth = (i + 1) * 18;
        orb.style.transform = `translate(${x * depth}px, ${y * depth}px)`;
    });
});
// ==================== API ====================
async function fetchApplications() {
    try {
        const res = await fetch(`${API_BASE}/applications`);
        if (res.ok) {
            applicationsState = await res.json();
            renderUI();
            fetchStats();
        } else {
            showSkeletonError();
            showToast("Failed to fetch applications from backend.", "error");
        }
    } catch (err) {
        console.error("API Error:", err);
        showSkeletonError();
        showToast("Cannot connect to FastAPI backend.", "error");
    }
}
async function fetchStats() {
    try {
        const res = await fetch(`${API_BASE}/applications/stats`);
        if (res.ok) {
            const stats = await res.json();
            const sc = stats.status_counts || {};
            animateStat('stat-applied', sc.Applied || 0);
            animateStat('stat-interview', sc.Interviewing || 0);
            animateStat('stat-offer', sc.Offer || 0);
            animateStat('stat-rejected', sc.Rejected || 0);
            const total = (sc.Applied || 0) + (sc.Interviewing || 0) + (sc.Offer || 0) + (sc.Rejected || 0);
            animateBar('bar-applied', sc.Applied, total);
            animateBar('bar-interviewing', sc.Interviewing, total);
            animateBar('bar-offer', sc.Offer, total);
            animateBar('bar-rejected', sc.Rejected, total);
            setPct('pct-applied', sc.Applied, total);
            setPct('pct-interviewing', sc.Interviewing, total);
            setPct('pct-offer', sc.Offer, total);
            setPct('pct-rejected', sc.Rejected, total);
        }
    } catch (err) {
        console.error("Stats Error:", err);
    }
}

// ---- Count-up animation ----
function animateStat(id, target) {
    const el = document.getElementById(id);
    const obj = { val: parseInt(el.innerText) || 0 };
    gsap.to(obj, {
        val: target, duration: 1.1, ease: "power2.out",
        onUpdate: () => { el.innerText = Math.round(obj.val); }
    });
}
function animateBar(id, val, total) {
    const pct = total > 0 ? (val / total) * 100 : 0;
    document.getElementById(id).style.width = pct + '%';
}
function setPct(id, val, total) {
    const pct = total > 0 ? Math.round((val / total) * 100) : 0;
    document.getElementById(id).innerText = pct + '% of total';
}
function showSkeletonError() {
    document.getElementById('jobs-container').innerHTML =
        `<div class="empty-state" style="grid-column:1/-1;">
            <div class="big">🔌</div>
            <p>Backend offline — start your FastAPI server on <code>${API_BASE}</code></p>
        </div>`;
}

// ==================== TABS ====================
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`panel-${tab}`).classList.add('active');

    const btn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
    const indicator = document.getElementById('tab-indicator');
    indicator.style.width = btn.offsetWidth + 'px';
    indicator.style.transform = `translateX(${btn.offsetLeft - 4}px)`;

    gsap.fromTo(`#panel-${tab}`, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" });

    if (tab === 'overview') renderOverviewExtras();
}

// ==================== OVERVIEW DASHBOARD (from /applications/stats) ====================
async function renderOverviewExtras() {
    try {
        const res = await fetch(`${API_BASE}/applications/stats`);
        if (!res.ok) return;
        const stats = await res.json();

        // Success rate gauge
        const rate = Math.round(stats.success_rate_percent || 0);
        document.getElementById('success-value').innerText = rate + '%';
        document.getElementById('success-gauge').style.background =
            `conic-gradient(#10b981 ${rate * 3.6}deg, var(--bg-input) ${rate * 3.6}deg)`;

        // Source breakdown
        renderBreakdown('source-breakdown', stats.source_breakdown || {});

        // Location breakdown
        renderBreakdown('location-breakdown', stats.location_Counts || {});

        // Oldest pending
        const box = document.getElementById('oldest-pending-box');
        const op = stats.Oldest_pending_application;
        if (op) {
            const days = Math.floor((Date.now() - new Date(op.date_applied)) / 86400000);
            box.innerHTML = `<span class="pending-company">${escapeHtml(op.company)}</span><br>
                Applied ${formatDate(op.date_applied)}<br>
                <span class="pending-days">${days} days waiting</span>`;
        } else {
            box.innerText = 'Nothing pending 🎉';
        }
    } catch (err) {
        console.error("Overview stats error:", err);
    }
}

function renderBreakdown(containerId, dataObj) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    const entries = Object.entries(dataObj).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    const max = Math.max(...entries.map(([, v]) => v), 1);

    if (entries.length === 0) {
        container.innerHTML = `<p style="color:var(--text-muted); font-size:0.8rem;">No data yet.</p>`;
        return;
    }

    entries.forEach(([label, count]) => {
        const row = document.createElement('div');
        row.className = 'breakdown-row';
        row.innerHTML = `
            <span class="breakdown-label">${escapeHtml(label)}</span>
            <div class="breakdown-track"><div class="breakdown-fill" style="width:${(count / max) * 100}%"></div></div>
            <span class="breakdown-count">${count}</span>
        `;
        container.appendChild(row);
    });
}

// Initialize indicator position on load
window.addEventListener('load', () => {
    const activeBtn = document.querySelector('.tab-btn.active');
    const indicator = document.getElementById('tab-indicator');
    if (activeBtn && indicator) {
        indicator.style.width = activeBtn.offsetWidth + 'px';
        indicator.style.transform = `translateX(${activeBtn.offsetLeft - 4}px)`;
    }
});
// ==================== FILTER & SEARCH ====================
function setFilter(btn) {
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.status;
    renderUI();
}
function getFilteredApps() {
    const query = document.getElementById('search-input').value.toLowerCase().trim();
    return Object.entries(applicationsState).filter(([id, app]) => {
        const matchesFilter = activeFilter === "All" || app.status === activeFilter;
        const matchesSearch = !query ||
            (app.company || '').toLowerCase().includes(query) ||
            (app.role || '').toLowerCase().includes(query);
        return matchesFilter && matchesSearch;
    });
}

// ==================== RENDER ====================
function renderUI() {
    const container = document.getElementById('jobs-container');
    container.innerHTML = '';
    const entries = getFilteredApps();
    if (entries.length === 0) {
        container.innerHTML = `<div class="empty-state">
            <div class="big">🗂️</div>
            <p>No applications found here.</p>
        </div>`;
        return;
    }
    entries.forEach(([id, app], index) => {
        const statusClass = `badge-${(app.status || 'applied').toLowerCase()}`;
        const card = document.createElement('div');
        card.className = 'job-card';
        card.innerHTML = `
            <div class="shine"></div>
            <div>
                <div class="job-header">
                    <div>
                        <span class="company-name">${escapeHtml(app.company)}</span>
                        <span class="job-id">${id}</span>
                        <div class="role-title">${escapeHtml(app.role)}</div>
                    </div>
                    <span class="status-badge ${statusClass}">${escapeHtml(app.status)}</span>
                </div>
                <div class="meta-tags">
                    ${app.location ? `<span class="tag">📍 ${escapeHtml(app.location)}</span>` : ''}
                    ${app.job_type ? `<span class="tag">💼 ${escapeHtml(app.job_type)}</span>` : ''}
                    ${app.application_source ? `<span class="tag">🔗 ${escapeHtml(app.application_source)}</span>` : ''}
                    ${app.salary ? `<span class="tag">💵 ${escapeHtml(app.salary)}</span>` : ''}
                </div>
                ${app.notes ? `<div class="job-notes">"${escapeHtml(app.notes)}"</div>` : ''}
            </div>
            <div class="job-footer">
                <span>Applied: ${formatDate(app.date_applied)}</span>
                <div class="action-btns">
                    ${app.job_url ? `<a href="${escapeAttr(app.job_url)}" target="_blank" rel="noopener" class="btn-icon">Link</a>` : ''}
                    <button class="btn-icon" onclick="editApp('${id}')">Edit</button>
                    <button class="btn-icon btn-delete" onclick="deleteApp('${id}')">Delete</button>
                </div>
            </div>
        `;
        container.appendChild(card);
        attachTilt(card);
});

// Staggered entrance
gsap.fromTo('.job-card',
    { opacity: 0, y: 28, scale: 0.97 },
    { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.06, ease: "power3.out", clearProps: "opacity,scale" }
    );
}
function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c =>
        ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function escapeAttr(str) {
    return String(str ?? '').replace(/"/g, '&quot;').replace(/javascript:/gi, '');
}
function formatDate(d) {
    if (!d) return '—';
    const date = new Date(d);
    if (isNaN(date)) return d;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ==================== 3D TILT + SPOTLIGHT ====================
function attachTilt(card) {
    card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left, y = e.clientY - rect.top;
        card.style.setProperty('--mx', x + 'px');
        card.style.setProperty('--my', y + 'px');
        const rx = ((y / rect.height) - 0.5) * -7;
        const ry = ((x / rect.width) - 0.5) * 7;
        card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'rotateX(0deg) rotateY(0deg) translateY(0)';
    });
}

// ==================== FORM SUBMIT (POST / PUT) ====================
document.getElementById('job-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const appId = document.getElementById('app-id').value;
    const newStatus = document.getElementById('status').value;
    const payload = {
        company: document.getElementById('company').value,
        role: document.getElementById('role').value,
        status: newStatus,
        date_applied: document.getElementById('date_applied').value
    };

const optionalFields = ['location', 'job_type', 'application_source', 'job_url', 'salary', 'notes'];
optionalFields.forEach(field => {
    const val = document.getElementById(field).value;
    if (val) payload[field] = val;
});

const submitBtn = document.getElementById('submit-btn');
submitBtn.innerText = 'Saving…';
submitBtn.disabled = true;

try {
    let url = `${API_BASE}/applications/create`;
    let method = 'POST';
    if (appId) {
        url = `${API_BASE}/applications/update/${appId}`;
        method = 'PUT';
    }
    const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (res.ok) {
        showToast(appId ? "Application updated! 🎉" : "Application created successfully!");
        if (newStatus === 'Offer') fireConfetti();
        closeModal();
        fetchApplications();
    } else {
        const errData = await res.json();
        showToast(errData.detail || "Error saving application", "error");
    }
} catch (err) {
        showToast("Server connection error.", "error");
    } finally {
        submitBtn.innerText = 'Save Application';
        submitBtn.disabled = false;
    }
});

// ==================== DELETE ====================
async function deleteApp(id) {
    const card = event.target.closest('.job-card');
    if (!confirm(`Are you sure you want to delete application ${id}?`)) return;
    try {
        const res = await fetch(`${API_BASE}/applications/delete/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast(`Deleted application ${id}`);
            if (card) {
                gsap.to(card, {
                    opacity: 0, scale: 0.9, y: 10, duration: 0.3, ease: "power2.in",
                    onComplete: fetchApplications
                });
            } else {
                fetchApplications();
            }
        } else {
            showToast("Failed to delete application.", "error");
        }
    } catch (err) {
        showToast("Connection error while deleting.", "error");
    }
}

// ==================== EDIT ====================
function editApp(id) {
    const app = applicationsState[id];
    if (!app) return;
    document.getElementById('modal-title').innerText = `Edit Application (${id})`;
    document.getElementById('app-id').value = id;
    document.getElementById('company').value = app.company || '';
    document.getElementById('role').value = app.role || '';
    document.getElementById('status').value = app.status || 'Applied';
    document.getElementById('date_applied').value = app.date_applied || '';
    document.getElementById('location').value = app.location || '';
    document.getElementById('job_type').value = app.job_type || '';
    document.getElementById('application_source').value = app.application_source || '';
    document.getElementById('job_url').value = app.job_url || '';
    document.getElementById('salary').value = app.salary || '';
    document.getElementById('notes').value = app.notes || '';
    openModal(true);
}

// ==================== MODAL ====================
function openModal(isEdit = false) {
    if (!isEdit) {
        document.getElementById('modal-title').innerText = "Add Application";
        document.getElementById('job-form').reset();
        document.getElementById('app-id').value = '';
        document.getElementById('date_applied').valueAsDate = new Date();
    }
    const modal = document.getElementById('job-modal');
    modal.classList.add('active');
    gsap.fromTo('#modal-content',
        { scale: 0.92, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: "back.out(1.6)" }
    );
    gsap.fromTo('#job-modal', { opacity: 0 }, { opacity: 1, duration: 0.25 });
}

function closeModal() {
    gsap.to('#modal-content', {
        scale: 0.94, opacity: 0, y: 12, duration: 0.22, ease: "power2.in",
        onComplete: () => {
            document.getElementById('job-modal').classList.remove('active');
            gsap.set('#modal-content', { clearProps: 'all' });
        }
    });
}

document.getElementById('job-modal').addEventListener('click', e => {
    if (e.target.id === 'job-modal') closeModal();
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.getElementById('job-modal').classList.contains('active')) {
        closeModal();
    }
});

// ==================== TOAST ====================
function showToast(msg, type = "success") {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast' + (type === 'error' ? ' error' : '');
    toast.innerHTML = `${escapeHtml(msg)}<div class="toast-bar"></div>`;
    container.appendChild(toast);
    gsap.fromTo(toast, { x: 120, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: "power3.out" });
    gsap.fromTo(toast.querySelector('.toast-bar'), { scaleX: 1 }, { scaleX: 0, duration: 3, ease: "none" });
    setTimeout(() => {
        gsap.to(toast, {
            x: 120, opacity: 0, duration: 0.3, ease: "power2.in",
            onComplete: () => toast.remove()
        });
    }, 3000);
}

// ==================== CONFETTI ====================
function fireConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = innerWidth; canvas.height = innerHeight;
    const colors = ['#6d8cff', '#b86fe8', '#ff5f91', '#d946ef', '#10b981', '#eab308'];
    const pieces = [];
    for (let i = 0; i < 140; i++) {
        pieces.push({
            x: innerWidth / 2, y: innerHeight / 2,
            vx: (Math.random() - 0.5) * 14,
            vy: Math.random() * -13 - 4,
            w: Math.random() * 8 + 4, h: Math.random() * 5 + 3,
            c: colors[Math.floor(Math.random() * colors.length)],
            rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.25,
            life: 1
        });
    }
    let frames = 0;
    function tick() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        for (const p of pieces) {
            if (p.life <= 0) continue;
            alive = true;
            p.vy += 0.35; p.x += p.vx; p.y += p.vy;
            p.rot += p.vr; p.life -= 0.008;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.globalAlpha = Math.max(p.life, 0);
            ctx.fillStyle = p.c;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        }
        frames++;
        if (alive && frames < 400) requestAnimationFrame(tick);
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    tick();
}

// ==================== PAGE ENTRANCE ====================
window.addEventListener('load', () => {
    gsap.from('#app-header', { y: -30, opacity: 0, duration: 0.6, ease: "power3.out" });
    gsap.from('#stats-title', { x: -20, opacity: 0, duration: 0.5, delay: 0.15 });
    gsap.from('.stat-card', { y: 30, opacity: 0, duration: 0.55, stagger: 0.08, delay: 0.2, ease: "power3.out" });
    gsap.from('#dash-controls', { y: 20, opacity: 0, duration: 0.5, delay: 0.45 });
});
// Initial Load
fetchApplications();