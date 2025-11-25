
# 代理转发配置指南 (Proxy Setup Guide)

由于网络环境限制，前端无法直接访问 Google Gemini API。您需要搭建一个中间层（代理），将前端的请求转发给 Google，并将 Google 的响应返回给前端。

本指南提供两种方案：
1. **方案 A：使用 Docker + Nginx 自建代理** (需要一台能访问 Google 的服务器)
2. **方案 B：使用 Cloudflare Workers** (免费，无需服务器，强烈推荐)

---

## 方案 A：使用 Docker + Nginx 自建代理

此方案会在您的服务器上运行一个 Nginx 容器，它监听请求并将其转发到 `generativelanguage.googleapis.com`。

### 1. 准备目录和文件

在服务器上创建一个目录（例如 `gemini-proxy`），并创建以下三个文件。

#### 文件 1: `nginx.conf`

这是核心配置文件。它处理 CORS（跨域）问题，因为您的前端和代理通常不在同一个域。

```nginx
events {
    worker_connections 1024;
}

http {
    server {
        listen 80;
        server_name localhost;

        # 处理 CORS 预检请求 (OPTIONS)
        # 浏览器在发送 POST 请求前会先发送 OPTIONS 询问是否允许跨域
        location / {
            if ($request_method = 'OPTIONS') {
                add_header 'Access-Control-Allow-Origin' '*' always;
                add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
                add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,x-goog-api-client,x-goog-api-key' always;
                add_header 'Access-Control-Max-Age' 1728000 always;
                add_header 'Content-Type' 'text/plain; charset=utf-8' always;
                add_header 'Content-Length' 0 always;
                return 204;
            }

            # 代理转发配置
            proxy_pass https://generativelanguage.googleapis.com;

            # 关键：设置 SSL 和主机头，欺骗 Google 以为请求是直接发给它的
            proxy_ssl_server_name on;
            proxy_set_header Host generativelanguage.googleapis.com;
            
            # 不转发客户端的 IP，保护隐私（可选）
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

            # 允许跨域响应头
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,x-goog-api-client,x-goog-api-key' always;
        }
    }
}
```

#### 文件 2: `Dockerfile`

```dockerfile
FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 文件 3: `docker-compose.yml`

```yaml
version: '3.8'
services:
  gemini-proxy:
    build: .
    ports:
      - "8081:80"  # 将宿主机的 8081 端口映射到容器的 80 端口
    restart: always
```

### 2. 部署与启动

在包含上述文件的目录中运行：

```bash
docker-compose up -d --build
```

### 3. 前端配置

1. 打开 Nano Banana Pro 网页。
2. 点击右上角的 **设置 (齿轮图标)**。
3. 在 **代理 / 基础 URL** 中输入：
   `http://<您的服务器IP>:8081` 
   (如果是本地测试则为 `http://localhost:8081`)
4. 输入您的 API Key 并保存。

---

## 方案 B：使用 Cloudflare Workers (推荐)

如果您没有服务器，可以使用 Cloudflare Workers 搭建一个无服务器的代理。

### 1. 创建 Worker

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. 进入 **Workers & Pages** -> **Create Application** -> **Create Worker**。
3. 命名为 `gemini-proxy` (或其他您喜欢的名字)，点击 **Deploy**。

### 2. 编辑代码

1. 点击 **Edit code**。
2. 将左侧 `worker.js` 的内容全部替换为以下代码：

```javascript
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 目标谷歌 API 地址
    const targetUrl = 'https://generativelanguage.googleapis.com' + url.pathname + url.search;

    // 处理 CORS 预检请求 (OPTIONS)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // 构建新请求
    const newRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    try {
      const response = await fetch(newRequest);
      
      // 构建新响应（为了添加 CORS 头）
      const newResponse = new Response(response.body, response);
      newResponse.headers.set('Access-Control-Allow-Origin', '*');
      
      return newResponse;
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  },
};
```

3. 点击右上角的 **Deploy** 保存。

### 3. 前端配置

1. 复制 Worker 的域名 (例如 `https://gemini-proxy.yourname.workers.dev`)。
2. 打开 Nano Banana Pro 网页设置。
3. 在 **代理 / 基础 URL** 中输入该域名。
   注意：地址不需要带 `/v1beta` 后缀，通常只需填入 `https://gemini-proxy.yourname.workers.dev`。
4. 保存并开始使用。

---

## 常见问题排查

**Q: 为什么提示 "404 Endpoint not found"?**
A: 请检查您填写的代理 URL 是否正确。
- 此时 URL **不** 应该包含 `/v1beta/models/...` 等具体路径。
- SDK 会自动拼接路径。如果您的代理地址是 `http://localhost:8081`，SDK 会请求 `http://localhost:8081/v1beta/models/gemini-pro:generateContent`。

**Q: 为什么提示 "Network Error" 或无反应？**
A: 
1. 检查浏览器控制台 (F12 -> Network)。
2. 如果看到 CORS 错误（红色），说明代理服务器没有正确返回 `Access-Control-Allow-Origin` 头。请检查 nginx.conf 或 Worker 代码。
3. 确保您的代理服务器可以访问外网（如果使用方案 A）。
