async function logout() {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (res.ok) {
        window.location.href = '/wall.html';
    }
}
window.logout = logout;

async function checkAuth() {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (!res.ok) window.location.href = '/login.html';
}
checkAuth();

let photos = [];
let currentPage = 1;
const perPage = 5;

function renderPhotos() {
    const container = document.getElementById('previous-photos');
    container.innerHTML = '';
    if (!photos || photos.length === 0) {
        container.innerHTML = '<p>No photo yet</p>';
        return;
    }
    container.innerHTML = photos.map(p =>
        ` <div style="position:relative; display:inline-block;">
            <img src="${p.filename}" style="width:50px; margin:5px;">
            <button onclick="deletePhoto(${p.id})" style="position:absolute; top:0; right:0; padding:2px 5px; font-size:10px; background:red; color:white; border:none; border-radius:4px; cursor:pointer;">✕</button>
        </div>`
    ).join('');
}


async function deletePhoto(id) {
    if (!confirm('Delete this photo?')) return;

    const res = await fetch(`/api/editor/${id}`, {
        method: 'DELETE',
        credentials: 'include'
    });

    if (res.ok) {
        loadPhotos(currentPage);
    } else {
        const err = await res.json();
        alert('Error: ' + err.error);
    }
}
window.deletePhoto = deletePhoto;


async function loadPhotos(page = 1) {
    const res = await fetch(`/api/gallery/me?page=${page}&limit=${perPage}`, {
        credentials: 'include'
    });

    if (!res.ok) return;

    const data = await res.json().catch(() => ({}));
    photos = data.images || [];
    const total = data.total || 0;
    renderPhotos();

    const nextBtn = document.getElementById('nextPage');
    const prevBtn = document.getElementById('prevPage');
    const pageInfo = document.getElementById('pageInfo');

    if (nextBtn) nextBtn.disabled = (page * perPage >= total);
    if (prevBtn) prevBtn.disabled = (page === 1);
    if (pageInfo) {
        pageInfo.textContent = total > 0
            ? `Page ${page} / ${Math.ceil(total / perPage)}`
            : '0 photo';
    }
}

document.getElementById('nextPage').addEventListener('click', () => {
    currentPage++;
    loadPhotos(currentPage);
});

document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        loadPhotos(currentPage);
    }
});

let selectedOverlay = null;
let selectedFilter = 'none';
const captureBtn = document.getElementById('capture');
const video = document.getElementById('video-webcam');
const previewImg = document.getElementById('preview-image');
let currentStream = null;
let uploadedFile = null;

async function loadOverlays() {
    const res = await fetch('/api/editor/overlays');
    const data = await res.json();
    const list = document.getElementById('overlays-list');
    list.innerHTML = data.overlays.map(overlay => `
        <img src="/uploads/overlays/${overlay}"
             class="overlay-thumb"
             data-name="${overlay}">
    `).join('');
    list.querySelectorAll('.overlay-thumb').forEach(img => {
        img.addEventListener('click', () => selectOverlay(img));
    });
}

function selectOverlay(img) {
    document.querySelectorAll('.overlay-thumb').forEach(i => i.classList.remove('selected'));
    img.classList.add('selected');
    selectedOverlay = img.dataset.name;
    captureBtn.disabled = false;
    const overlayPreview = document.getElementById('overlay-preview');
    overlayPreview.src = `/uploads/overlays/${selectedOverlay}`;
    overlayPreview.style.display = 'block';
}

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 300, height: 300 }
        });
        currentStream = stream;
        video.srcObject = stream;
        video.style.display = 'block';
        previewImg.style.display = 'none';
    } catch (err) {
        video.style.display = 'none';
    }
}

document.getElementById('upload-image').addEventListener('change', (e) => {
    uploadedFile = e.target.files[0];
    if (uploadedFile) {
        const url = URL.createObjectURL(uploadedFile);
        previewImg.src = url;
        previewImg.style.display = 'block';
        video.style.display = 'none';
    }
});

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedFilter = btn.dataset.filter;
        video.style.filter = selectedFilter;
        previewImg.style.filter = selectedFilter;
    });
});

captureBtn.addEventListener('click', async () => {
    if (!selectedOverlay) {
        alert('Choose an overlay !');
        return;
    }

    const size = 300;
    const source = uploadedFile ? previewImg : video;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.filter = selectedFilter;
    ctx.drawImage(source, 0, 0, size, size);

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));

    const form = new FormData();
    form.append('image', blob, 'capture.jpg');
    form.append('overlay', selectedOverlay);

    const res = await fetch('/api/editor/capture', {
        method: 'POST',
        credentials: 'include',
        body: form
    });

    if (res.ok) {
        alert('Photo saved!');
        uploadedFile = null;
        document.getElementById('upload-image').value = '';
        previewImg.style.display = 'none';
        previewImg.style.filter = 'none';
        video.style.filter = 'none';
        selectedFilter = 'none';
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('selected'));
        startCamera();
        loadPhotos(1);
    } else {
        const err = await res.json();
        alert('Error: ' + err.error);
    }
});

loadOverlays();
startCamera();
loadPhotos(1);copilot
