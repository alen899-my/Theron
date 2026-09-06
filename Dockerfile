FROM mcr.microsoft.com/playwright:jammy

WORKDIR /app

# Copy dependency specifications from backend
COPY backend/package*.json ./

# Install project dependencies
RUN npm install

# Download Chromium browser
RUN npx playwright install chromium

# Copy backend application source
COPY backend/ ./

# Expose backend port
ENV PORT=4000
EXPOSE 4000

CMD ["npm", "start"]
