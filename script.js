// Custom cursor
const cursor = document.querySelector('.cursor');
const cursorGlow = document.querySelector('.cursor-glow');

document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
    cursorGlow.style.left = e.clientX + 'px';
    cursorGlow.style.top = e.clientY + 'px';
});

const interactiveElements = document.querySelectorAll('a, button, input, .icon-btn, .nav-link');
interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});

// Navigation
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        const targetSection = link.dataset.section;
        
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        sections.forEach(s => s.classList.remove('active'));
        document.getElementById(targetSection).classList.add('active');
    });
});

// Webhook storage
let webhooks = JSON.parse(localStorage.getItem('webhooks') || '[]');

// Create webhook
document.getElementById('createBtn').addEventListener('click', () => {
    const name = document.getElementById('webhookName').value.trim();
    const desc = document.getElementById('webhookDesc').value.trim();

    if (!name) {
        showToast('Please enter a webhook name');
        return;
    }

    const webhookId = generateId();
    const webhook = {
        id: webhookId,
        name: name,
        description: desc,
        url: `${window.location.origin}/webhook/${webhookId}`,
        created: new Date().toISOString(),
        requests: 0,
        logs: []
    };

    webhooks.push(webhook);
    localStorage.setItem('webhooks', JSON.stringify(webhooks));

    document.getElementById('webhookName').value = '';
    document.getElementById('webhookDesc').value = '';

    showToast('Webhook created successfully!');
    renderWebhooks();

    // Switch to manage tab
    document.querySelector('[data-section="manage"]').click();
});

// Render webhooks
function renderWebhooks() {
    const list = document.getElementById('webhookList');
    
    if (webhooks.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p>No webhooks yet. Create one to get started!</p>
            </div>
        `;
        return;
    }

    list.innerHTML = webhooks.map(webhook => `
        <div class="webhook-item">
            <div class="webhook-header">
                <div>
                    <div class="webhook-name">${escapeHtml(webhook.name)}</div>
                    <div class="webhook-id">${webhook.id}</div>
                </div>
                <div class="webhook-actions">
                    <button class="icon-btn" onclick="copyWebhookUrl('${webhook.url}')" title="Copy URL">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                    <button class="icon-btn" onclick="viewLogs('${webhook.id}')" title="View Logs">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                    </button>
                    <button class="icon-btn" onclick="deleteWebhook('${webhook.id}')" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
            ${webhook.description ? `<p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 12px;">${escapeHtml(webhook.description)}</p>` : ''}
            <div class="webhook-url">${webhook.url}</div>
            <div class="webhook-stats">
                <div class="stat">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                    ${webhook.requests} requests
                </div>
                <div class="stat">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    ${new Date(webhook.created).toLocaleDateString()}
                </div>
            </div>
        </div>
    `).join('');
}

// Copy webhook URL
function copyWebhookUrl(url) {
    navigator.clipboard.writeText(url).then(() => {
        showToast('Webhook URL copied!');
    }).catch(() => {
        showToast('Failed to copy URL');
    });
}

// View logs
async function viewLogs(id) {
    const webhook = webhooks.find(w => w.id === id);
    if (!webhook) return;

    try {
        // Fetch logs from backend
        const response = await fetch(`/webhook/${id}/logs`);
        const data = await response.json();
        webhook.logs = data.logs || [];
        
        // Update request count
        webhook.requests = webhook.logs.length;
        localStorage.setItem('webhooks', JSON.stringify(webhooks));
        renderWebhooks();
        
    } catch (error) {
        console.error('Failed to fetch logs:', error);
    }

    const logsHtml = webhook.logs.length === 0 
        ? '<div class="empty-state"><div class="empty-icon">📋</div><p>No requests yet</p></div>'
        : webhook.logs.map(log => `
            <div class="log-item">
                <div class="log-header">
                    <span class="log-method">${log.method}</span>
                    <span class="log-time">${new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <div class="log-body">${escapeHtml(JSON.stringify(log.body, null, 2))}</div>
            </div>
        `).join('');

    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 32px;';
    modal.innerHTML = `
        <div style="max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 20px; padding: 40px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2 style="font-size: 24px;">Logs - ${escapeHtml(webhook.name)}</h2>
                <button class="icon-btn" onclick="this.closest('div[style*=fixed]').remove()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="logs-container">${logsHtml}</div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Delete webhook
function deleteWebhook(id) {
    if (!confirm('Are you sure you want to delete this webhook?')) return;
    
    webhooks = webhooks.filter(w => w.id !== id);
    localStorage.setItem('webhooks', JSON.stringify(webhooks));
    showToast('Webhook deleted');
    renderWebhooks();
}

// Generate ID
function generateId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// Toast notification
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Initialize
renderWebhooks();