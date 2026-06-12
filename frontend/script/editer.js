async function logout() {
	try {
		const res = await fetch("/api/auth/logout", {
			method: "POST"
		});

		if (!res.ok) {
			throw new Error("Logout failed");
		}

		window.location.href = "/wall.html";
	} catch (err) {
		console.error(err);
	}
}

window.logout = logout;
async function checkAuth() {
    const res = await fetch('/api/auth/me', { credentials: 'include' })
    if (!res.ok) {
        window.location.href = '/login.html'
    }
}

checkAuth()

const video = document.getElementById('video-webcam');
const sizeInput = document.getElementById('size');
const sizeValue = document.getElementById('size-value');

async function loadOverlays() {
    const res = await fetch('/api/editor/overlays')
    const data = await res.json()
    
    const list = document.getElementById('overlays-list')
    list.innerHTML = data.overlays.map(overlay => `
        <img src="/uploads/overlays/${overlay}" 
             class="overlay-thumb" 
             data-name="${overlay}"
             onclick="selectOverlay(this)">
    `).join('')
}



let selectedOverlay = null;
const captureBtn = document.getElementById('capture');
captureBtn.disabled = true;

function selectOverlay(img) {
    document.querySelectorAll('.overlay-thumb').forEach(i => i.classList.remove('selected'));
    img.classList.add('selected');
    selectedOverlay = img.dataset.name;
    captureBtn.disabled = false;
}

captureBtn.addEventListener('click', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
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
        }
    }, 'image/jpeg');
});

loadOverlays();

let currentStream;

async function startCamera(size) {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }

    const stream = await navigator.mediaDevices.getUserMedia({
        video: {
            width: size,
            height: size,
            facingMode: "environment"
        }
    });

    currentStream = stream;
    video.srcObject = stream;
}

sizeInput.addEventListener('input', () => {
    sizeValue.textContent = sizeInput.value;
});

sizeInput.addEventListener('change', () => {
    startCamera(Number(sizeInput.value));
});

startCamera(300);


	document.querySelectorAll('button[aria-controls]').forEach(button => {
		button.addEventListener('click', () => {
			const panel = document.getElementById(
				button.getAttribute('aria-controls')
			);
	
			const expanded =
				button.getAttribute('aria-expanded') === 'true';
	
			button.setAttribute('aria-expanded', !expanded);
			panel.hidden = expanded;
		});
	});