FROM mcr.microsoft.com/playwright:v1.50.0-jammy

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Install chromium browser
RUN npx playwright install chromium

# Copy source code
COPY . .

# Set default port (Render will inject PORT environment variable)
ENV PORT=4000
EXPOSE 4000

# Start backend server
CMD ["npm", "start"]
