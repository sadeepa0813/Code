/* --------------------------- A/L & O/L Exam Countdown - Comment Name Input Version --------------------------- */

// Configuration
const CONFIG = {
    BACKEND: {
        BIN_ID: '6925cbcad0ea881f40ff82ef',
        API_KEY: '$2a$10$FiJfon3yzXyaL8aqn0M.wOoFMXsTiXzsWSjUXTEVPFJ.dVbhphR6m'
    },
    EXAM_DATES: {
        '2025': new Date('2025-11-10T00:00:00'),
        '2026': new Date('2026-08-03T00:00:00'),
        '2027': new Date('2027-08-02T00:00:00'),
        'ol': new Date('2025-12-01T00:00:00')
    },
    STUDY_STARTS: {
        '2025': new Date('2024-01-01'),
        '2026': new Date('2025-01-01'),
        '2027': new Date('2026-01-01'),
        'ol': new Date('2024-01-01')
    }
};

// Global Variables
let currentBatch = '2026';
let comments = [];
let likedComments = new Set();
let replyingTo = null;
let editingComment = null;

// Backend URLs
const BACKEND_GET_URL = `https://api.jsonbin.io/v3/b/${CONFIG.BACKEND.BIN_ID}/latest`;
const BACKEND_PUT_URL = `https://api.jsonbin.io/v3/b/${CONFIG.BACKEND.BIN_ID}`;

// UI Helpers
function showNotification(icon, message) {
    const notificationToast = document.getElementById('notificationToast');
    const notificationIcon = document.getElementById('notificationIcon');
    const notificationMessage = document.getElementById('notificationMessage');
    if (!notificationToast || !notificationIcon || !notificationMessage) return;
    notificationIcon.textContent = icon;
    notificationMessage.textContent = message;
    notificationToast.classList.add('show');
    setTimeout(() => notificationToast.classList.remove('show'), 3000);
}

function showAlert(icon, title, message) {
    const alertIcon = document.getElementById('alertIcon');
    const alertTitle = document.getElementById('alertTitle');
    const alertMessage = document.getElementById('alertMessage');
    const alertPopup = document.getElementById('alertPopup');
    if (!alertPopup || !alertIcon || !alertTitle || !alertMessage) return;
    alertIcon.textContent = icon;
    alertTitle.textContent = title;
    alertMessage.textContent = message;
    alertPopup.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeAlert() {
    const alertPopup = document.getElementById('alertPopup');
    if (!alertPopup) return;
    alertPopup.classList.remove('show');
    document.body.style.overflow = '';
}

// Character Count Updates
function updateCharCount() {
    const input = document.getElementById('commentInput');
    const charCount = document.getElementById('charCount');
    if (!input || !charCount) return;

    const count = input.value.length;
    charCount.textContent = count;
    charCount.style.color = count > 450 ? 'var(--error)' : 
                           count > 400 ? 'var(--warning)' : 'var(--text-secondary)';
}

function updateNameCharCount() {
    const nameInput = document.getElementById('commentNameInput');
    const nameCharCount = document.getElementById('nameCharCount');
    if (!nameInput || !nameCharCount) return;

    const count = nameInput.value.length;
    nameCharCount.textContent = count;
    nameCharCount.style.color = count > 15 ? 'var(--error)' : 
                               count > 10 ? 'var(--warning)' : 'var(--text-secondary)';
}

// Enter Key Handling for Comment Submission
document.addEventListener('DOMContentLoaded', function() {
    const commentInput = document.getElementById('commentInput');
    if (commentInput) {
        commentInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                submitComment();
            }
        });
    }

    const nameInput = document.getElementById('commentNameInput');
    if (nameInput) {
        nameInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('commentInput').focus();
            }
        });
    }
});

// Comment Character Count Listeners
document.addEventListener('input', function(e) {
    if (e.target && e.target.id === 'commentInput') {
        updateCharCount();
    }
    if (e.target && e.target.id === 'commentNameInput') {
        updateNameCharCount();
    }
});

// Enhanced Comment Submission with Name Input
async function submitComment() {
    const input = document.getElementById('commentInput');
    const nameInput = document.getElementById('commentNameInput');
    const submitBtn = document.getElementById('commentSubmit');

    if (!input || !nameInput || !submitBtn) return;

    const content = input.value.trim();
    const userName = nameInput.value.trim() || 'අනාමික';

    if (content === '') {
        showAlert('⚠️', 'හිස් අදහස', 'කරුණාකර අදහසක් ලියන්න!');
        return;
    }

    if (content.length > 500) {
        showAlert('⚠️', 'දිගු අදහස', 'අදහස 500 අකුරුවලින් අඩු විය යුතුය!');
        return;
    }

    if (userName.length > 20) {
        showAlert('⚠️', 'දිගු නම', 'නම 20 අකුරුවලින් අඩු විය යුතුය!');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner"></span> යොමු කරමින්...';

    try {
        if (editingComment) {
            await editExistingComment(editingComment, content, userName);
        } else {
            await submitNewComment(content, userName);
        }
        
        // Clear inputs after successful submission
        input.value = '';
        nameInput.value = '';
        updateCharCount();
        updateNameCharCount();
        cancelEdit();
        
    } catch (error) {
        console.error('Submit comment error:', error);
        showNotification('❌', 'දෝෂයක්! නැවත උත්සාහ කරන්න');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'අදහස් යොමු කරන්න';
        submitBtn.style.background = '';
    }
}

// Submit New Comment
async function submitNewComment(content, userName) {
    const newComment = {
        id: Date.now(),
        author: userName,
        content: content,
        timestamp: new Date().toISOString(),
        likes: 0
    };

    comments.unshift(newComment);
    localStorage.setItem('exam_countdown_comments', JSON.stringify(comments));
    
    renderComments();
    updateCommentsCount();
    
    const backendSuccess = await updateBackendWithComment(newComment);
    
    if (backendSuccess) {
        showNotification('✅', 'අදහස සාර්ථකව යොමු කළා! 🎉');
    } else {
        showNotification('⚠️', 'අදහස සුරකින ලදී! (Backend issue)');
    }
}

// Edit Existing Comment
async function editExistingComment(commentId, newContent, userName) {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    comment.content = newContent;
    comment.author = userName; // Allow name change when editing
    comment.lastEdited = new Date().toISOString();
    
    localStorage.setItem('exam_countdown_comments', JSON.stringify(comments));
    renderComments();
    
    const backendSuccess = await updateBackendAfterEdit();
    
    if (backendSuccess) {
        showNotification('✅', 'අදහස සාර්ථකව වෙනස් කළා!');
    } else {
        showNotification('⚠️', 'අදහස සුරකින ලදී! (Backend issue)');
    }
}

// Start Editing a Comment
function startEdit(commentId) {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    editingComment = commentId;
    const commentInput = document.getElementById('commentInput');
    const nameInput = document.getElementById('commentNameInput');
    const submitBtn = document.getElementById('commentSubmit');
    
    if (commentInput && nameInput && submitBtn) {
        commentInput.value = comment.content;
        nameInput.value = comment.author;
        commentInput.focus();
        submitBtn.textContent = 'අදහස් යාවත්කාලීන කරන්න';
        submitBtn.style.background = 'var(--warning)';
        
        updateCharCount();
        updateNameCharCount();
    }
    
    showNotification('✏️', 'අදහස සංස්කරණය කරමින්...');
}

// Cancel Edit Mode
function cancelEdit() {
    editingComment = null;
    const commentInput = document.getElementById('commentInput');
    const nameInput = document.getElementById('commentNameInput');
    const submitBtn = document.getElementById('commentSubmit');
    
    if (commentInput && nameInput && submitBtn) {
        commentInput.value = '';
        nameInput.value = '';
        commentInput.placeholder = 'මෙම වෙබ් අඩවිය ගැන ඔබගේ අදහස් මෙතැනින් ලියන්න...';
        submitBtn.textContent = 'අදහස් යොමු කරන්න';
        submitBtn.style.background = '';
        
        updateCharCount();
        updateNameCharCount();
    }
}

// Delete Comment
async function deleteComment(commentId) {
    if (!confirm('ඔබට මෙම අදහස මැකීමට අවශ්‍යද?')) return;

    const commentIndex = comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) return;

    comments.splice(commentIndex, 1);
    localStorage.setItem('exam_countdown_comments', JSON.stringify(comments));
    
    renderComments();
    updateCommentsCount();
    
    const backendSuccess = await updateBackendAfterDelete();
    
    if (backendSuccess) {
        showNotification('✅', 'අදහස සාර්ථකව මකා දමන ලදී!');
    } else {
        showNotification('⚠️', 'අදහස ස්ථානීයව මකා දමන ලදී (Backend issue)');
    }
}

// Backend Functions
async function updateBackendWithComment(newComment) {
    try {
        const getResponse = await fetch(BACKEND_GET_URL, {
            headers: { 'X-Master-Key': CONFIG.BACKEND.API_KEY, 'X-Bin-Meta': false }
        });
        
        if (!getResponse.ok) throw new Error(`Failed to fetch: ${getResponse.status}`);
        
        const existingData = await getResponse.json();
        let currentComments = existingData.comments || [];
        
        currentComments.unshift(newComment);
        if (currentComments.length > 1000) currentComments = currentComments.slice(0, 500);
        
        const updateResponse = await fetch(BACKEND_PUT_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': CONFIG.BACKEND.API_KEY,
                'X-Bin-Versioning': false
            },
            body: JSON.stringify({
                ...existingData,
                comments: currentComments,
                lastUpdated: new Date().toISOString(),
                totalComments: currentComments.length
            })
        });
        
        return updateResponse.ok;
        
    } catch (error) {
        console.error('Backend update error:', error);
        return false;
    }
}

async function updateBackendAfterEdit() {
    try {
        const getResponse = await fetch(BACKEND_GET_URL, {
            headers: { 'X-Master-Key': CONFIG.BACKEND.API_KEY, 'X-Bin-Meta': false }
        });
        
        if (!getResponse.ok) return false;
        
        const existingData = await getResponse.json();
        const updateResponse = await fetch(BACKEND_PUT_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': CONFIG.BACKEND.API_KEY
            },
            body: JSON.stringify({
                ...existingData,
                comments: comments,
                lastUpdated: new Date().toISOString()
            })
        });
        
        return updateResponse.ok;
        
    } catch (error) {
        console.error('Backend edit update error:', error);
        return false;
    }
}

async function updateBackendAfterDelete() {
    try {
        const getResponse = await fetch(BACKEND_GET_URL, {
            headers: { 'X-Master-Key': CONFIG.BACKEND.API_KEY, 'X-Bin-Meta': false }
        });
        
        if (!getResponse.ok) return false;
        
        const existingData = await getResponse.json();
        const updateResponse = await fetch(BACKEND_PUT_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': CONFIG.BACKEND.API_KEY
            },
            body: JSON.stringify({
                ...existingData,
                comments: comments,
                lastUpdated: new Date().toISOString(),
                totalComments: comments.length
            })
        });
        
        return updateResponse.ok;
        
    } catch (error) {
        console.error('Backend delete update error:', error);
        return false;
    }
}

// Load Comments from Backend
async function loadCommentsFromBackend() {
    try {
        const response = await fetch(BACKEND_GET_URL + '?t=' + Date.now(), {
            headers: { 'X-Master-Key': CONFIG.BACKEND.API_KEY, 'X-Bin-Meta': false }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        
        const data = await response.json();
        comments = data.comments || [];
        localStorage.setItem('exam_countdown_comments', JSON.stringify(comments));
        
        renderComments();
        updateCommentsCount();
        return true;
        
    } catch (error) {
        console.error('Error loading comments:', error);
        const stored = localStorage.getItem('exam_countdown_comments');
        if (stored) {
            try { comments = JSON.parse(stored); } catch (e) { comments = []; }
        } else {
            comments = [];
        }
        renderComments();
        updateCommentsCount();
        return false;
    }
}

// Render Comments
function renderComments() {
    const commentsList = document.getElementById('commentsList');
    if (!commentsList) return;

    if (comments.length === 0) {
        commentsList.innerHTML = '<div class="empty-comments">තවම කිසිම අදහසක් නැත. පළමු අදහස ලියන්න!</div>';
        return;
    }

    commentsList.innerHTML = comments.map(comment => {
        const isEdited = comment.lastEdited && comment.lastEdited !== comment.timestamp;
        const isAnonymous = comment.author === 'අනාමික';
        
        return `
        <div class="comment-item" data-comment-id="${comment.id}">
            <div class="comment-header">
                <div class="comment-author">
                    ${comment.author}
                    ${isAnonymous ? 
                        '<span class="user-badge anonymous">අනාමික</span>' : 
                        '<span class="user-badge">පරිශීලක</span>'
                    }
                </div>
                <span class="comment-time">
                    ${formatTime(comment.timestamp)}
                    ${isEdited ? ' (edited)' : ''}
                </span>
            </div>
            <div class="comment-content">${comment.content}</div>
            <div class="comment-footer">
                <button class="comment-action ${likedComments.has(comment.id) ? 'liked' : ''}" onclick="toggleLike(${comment.id})">
                    <i class="fas fa-heart heart-icon"></i>
                    <span>${comment.likes}</span>
                </button>
                <button class="comment-action edit-btn" onclick="startEdit(${comment.id})">
                    <i class="fas fa-edit"></i>
                    <span>සංස්කරණය</span>
                </button>
                <button class="comment-action delete-btn" onclick="deleteComment(${comment.id})">
                    <i class="fas fa-trash"></i>
                    <span>මකන්න</span>
                </button>
            </div>
        </div>
        `;
    }).join('');
}

// Format Time
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'දැන්';
    if (minutes < 60) return `${minutes} මිනිත්තුවකට පෙර`;
    if (hours < 24) return `${hours} පැයකට පෙර`;
    return `${days} දිනකට පෙර`;
}

// Update Comments Count
function updateCommentsCount() {
    const countElement = document.getElementById('commentsCount');
    if (countElement) countElement.textContent = `${comments.length} අදහස්`;
}

// Toggle Like
function toggleLike(commentId) {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    if (likedComments.has(commentId)) {
        comment.likes--;
        likedComments.delete(commentId);
    } else {
        comment.likes++;
        likedComments.add(commentId);
    }

    renderComments();
    localStorage.setItem('exam_countdown_comments', JSON.stringify(comments));
}

// Load Comments
async function loadComments() {
    try {
        const storedComments = localStorage.getItem('exam_countdown_comments');
        if (storedComments) {
            comments = JSON.parse(storedComments);
            renderComments();
            updateCommentsCount();
        }
        
        setTimeout(async () => {
            try { await loadCommentsFromBackend(); } 
            catch (error) { console.error('Background sync failed:', error); }
        }, 1000);
        
    } catch (error) {
        console.error('Load comments error:', error);
    }
}

// Auto-refresh comments
function startCommentRefresh() {
    setInterval(async () => {
        try { await loadCommentsFromBackend(); } 
        catch (error) { console.error('Auto-refresh failed:', error); }
    }, 30000);
}

// Initialize Comments
function initializeComments() {
    loadComments();
    startCommentRefresh();
    updateCharCount();
    updateNameCharCount();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeComments();
});

console.log('🚀 A/L & O/L Exam Countdown - COMMENT NAME INPUT VERSION LOADED');
