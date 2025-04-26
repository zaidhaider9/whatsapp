# Use Node.js LTS version as base image
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install express-session connect-mongo

RUN npm install

# Copy source code
COPY . .

# Create images directory and copy default avatar
RUN mkdir -p public/images
COPY public/images/default-avatar.png public/images/

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 