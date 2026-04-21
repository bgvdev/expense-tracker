FROM node:20-alpine AS development

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies — uses local npm cache if available
# In CI/network-constrained envs, node_modules can be volume-mounted from host
RUN npm install --prefer-offline || npm install

# Copy source code
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
