# ۱. انتخاب نسخه Node.js
FROM node:18-slim

# ۲. نصب FFmpeg (دستگاه برش ویدیو)
RUN apt-get update && apt-get install -y ffmpeg --no-install-recommends && rm -rf /var/lib/apt/lists/*

# ۳. مشخص کردن پوشه کاری در کارگاه
WORKDIR /usr/src/app

# ۴. کپی کردن لیست نیازمندی‌های کارگاه
COPY package*.json ./

# ۵. نصب نیازمندی‌ها (مثل چسب و ...)
RUN npm install --production

# ۶. کپی کردن بقیه کدهای کارگاه
COPY . .

# ۷. اعلام اینکه کارگاه روی چه پورتی کار می‌کنه
EXPOSE 3000

# ۸. دستور روشن کردن کارگاه
CMD [ "node", "server.js" ]