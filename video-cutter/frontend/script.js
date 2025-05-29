const step1Div = document.getElementById('step1');
const step2Div = document.getElementById('step2');
const goToStep2Button = document.getElementById('goToStep2');
const backToStep1Button = document.getElementById('backToStep1');
const trimAndDownloadButton = document.getElementById('trimAndDownload');
const videoUrlInput = document.getElementById('videoUrl');
const displayVideoUrlElement = document.getElementById('displayVideoUrl');
const messageArea = document.getElementById('messageArea');
const loadingSpinner = document.getElementById('loadingSpinner');
const startMinutesInput = document.getElementById('startMinutes');
const startSecondsInput = document.getElementById('startSeconds');
const endMinutesInput = document.getElementById('endMinutes');
const endSecondsInput = document.getElementById('endSeconds');

// این قسمت مهم است! بعدا آدرس کارگاه (بک‌اند) را اینجا می‌نویسیم
let BACKEND_API_URL = 'https://your-backend-will-go-here.com/api/trim'; // فعلا یک آدرس الکی

function showMessage(text, type = 'info') {
    messageArea.textContent = text;
    messageArea.className = `message-box message-${type}`;
    messageArea.classList.remove('hidden');
}
function hideMessage() { messageArea.classList.add('hidden'); }
function showLoading(show) { loadingSpinner.classList.toggle('hidden', !show); }

goToStep2Button.addEventListener('click', () => {
    if (!videoUrlInput.value.trim()) {
        showMessage('لینک ویدیو را وارد کنید.', 'error'); return;
    }
    try { new URL(videoUrlInput.value.trim()); }
    catch (_) { showMessage('فرمت لینک ویدیو معتبر نیست.', 'error'); return; }
    displayVideoUrlElement.textContent = videoUrlInput.value.trim();
    step1Div.classList.add('hidden'); step2Div.classList.remove('hidden'); hideMessage();
});

backToStep1Button.addEventListener('click', () => {
    step2Div.classList.add('hidden'); step1Div.classList.remove('hidden'); hideMessage();
});

function formatTime(minutes, seconds) {
    return `<span class="math-inline">\{String\(minutes\)\.padStart\(2, '0'\)\}\:</span>{String(seconds).padStart(2, '0')}:00`;
}

trimAndDownloadButton.addEventListener('click', async () => {
    const startMin = parseInt(startMinutesInput.value || '0', 10);
    const startSec = parseInt(startSecondsInput.value || '0', 10);
    const endMin = parseInt(endMinutesInput.value || '0', 10);
    const endSec = parseInt(endSecondsInput.value || '0', 10);

    if (isNaN(startMin) || isNaN(startSec) || isNaN(endMin) || isNaN(endSec) || startMin < 0 || startSec < 0 || startSec > 59 || endMin < 0 || endSec < 0 || endSec > 59) {
        showMessage('مقادیر زمان نامعتبر.', 'error'); return;
    }
    if (((endMin * 60) + endSec) <= ((startMin * 60) + startSec)) {
        showMessage('زمان پایان باید بعد از زمان شروع باشد.', 'error'); return;
    }

    hideMessage(); showLoading(true); trimAndDownloadButton.disabled = true;

    try {
        const response = await fetch(BACKEND_API_URL, { // ارسال سفارش به کارگاه
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                videoUrl: videoUrlInput.value.trim(),
                startTime: formatTime(startMin, startSec),
                endTime: formatTime(endMin, endSec),
            }),
        });
        if (response.ok) {
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a'); a.style.display = 'none'; a.href = downloadUrl;
            const disposition = response.headers.get('content-disposition');
            let filename = 'trimmed_video.mp4';
            if (disposition) { const m = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition); if (m && m[1]) filename = m[1].replace(/['"]/g, '');}
            a.download = filename; document.body.appendChild(a); a.click();
            window.URL.revokeObjectURL(downloadUrl); a.remove();
            showMessage('ویدیو با موفقیت دانلود شد!', 'success');
        } else {
            const err = await response.json(); showMessage(`خطا: ${err.message || response.statusText}`, 'error');
        }
    } catch (error) { showMessage(`خطای شبکه: ${error.message}`, 'error'); }
    finally { showLoading(false); trimAndDownloadButton.disabled = false; }
});