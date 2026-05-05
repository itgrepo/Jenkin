# syntax=docker/dockerfile:1.6

# ----------- Build Stage -----------
FROM node:22-alpine AS builder

WORKDIR /app

# (optional แต่ช่วย) ติดตั้ง CA cert ให้ HTTPS เสถียรขึ้นใน alpine
RUN apk add --no-cache ca-certificates

# Copy only dependency manifests first (เพื่อให้ Docker layer cache ทำงาน)
COPY package.json yarn.lock ./

# ตั้งค่า yarn ให้ใช้ npm registry + เพิ่ม timeout + retry
RUN yarn config set registry https://registry.npmjs.org/ \
    && yarn config set network-timeout 600000 -g \
    && yarn config set prefer-offline true -g

# ใช้ cache ของ yarn (ถ้าเปิด BuildKit จะเร็วขึ้นมาก)
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    for i in 1 2 3; do \
    yarn install --frozen-lockfile --non-interactive && break; \
    echo "yarn install failed... retry $i/3"; \
    sleep 10; \
    done

# Copy source code
COPY . .

# Build arg / env
ARG PUBLIC_URL=http://202.9.90.53:9501/e-service-tisi-web
ENV PUBLIC_URL=$PUBLIC_URL

# Build
RUN yarn build


# ----------- Production Stage -----------
FROM nginx:stable-perl

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Replace default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
