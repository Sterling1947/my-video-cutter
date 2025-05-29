const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

const tempDir = path.join(__dirname, 'trimmed_videos_temp'); // پوشه موقت برای ویدیوها
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

app.post('/api/trim', (req, res) => {
    const { videoUrl, startTime, endTime } = req.body;
    if (!videoUrl || !startTime || !endTime) {
        return res.status(400).json({ message: 'Missing parameters' });
    }

    const outputFileName = `trimmed_${Date.now()}.mp4`;
    const outputPath = path.join(tempDir, outputFileName);

    console.log(`Trimming: ${videoUrl} from ${startTime} to ${endTime} -> ${outputFileName}`);

    const ffmpegArgs = [
        '-ss', startTime,
        '-i', videoUrl,
        '-to', endTime,
        '-c', 'copy',
        '-movflags', 'frag_keyframe+empty_moov',
        '-y',
        outputPath
    ];

    const ffmpeg = spawn('ffmpeg', ffmpegArgs);
    let ffmpegLogs = "";

    ffmpeg.stderr.on('data', (data) => {
        ffmpegLogs += data.toString();
        console.error(`FFMPEG_LOG: ${data}`);
    });

    ffmpeg.on('close', (code) => {
        console.log(`FFmpeg exited with code ${code}. Logs: ${ffmpegLogs.substring(0, 500)}`);
        if (code === 0 && fs.existsSync(outputPath)) {
            res.download(outputPath, outputFileName, (err) => {
                if (err) console.error("Error sending file:", err);
                fs.unlink(outputPath, (unlinkErr) => {
                    if (unlinkErr) console.error("Error deleting temp file:", unlinkErr);
                    else console.log(`Deleted temp file: ${outputFileName}`);
                });
            });
        } else {
            res.status(500).json({ message: 'Failed to trim video.', error: ffmpegLogs });
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); // پاک کردن فایل ناقص
        }
    });
    ffmpeg.on('error', (err) => {
        console.error("Failed to start FFMPEG:", err);
        res.status(500).json({ message: 'FFmpeg execution error.', error: err.message });
    });
});

app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));