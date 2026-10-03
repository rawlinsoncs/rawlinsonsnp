# Runtime image: the service is two small files and no dependencies.
# node:24.12.0 matches .tool-versions and CI.
FROM node:24.12.0-alpine

WORKDIR /app
COPY server.mjs reader.mjs package.json ./

ENV NODE_ENV=production \
    PORT=8787 \
    CACHE_TTL_MS=900000 \
    BIND_HOST=127.0.0.1

# No auth on the endpoints, so the bind stays on loopback: compose joins the
# host network namespace rather than publishing a port, so a stray
# `docker run -p 8787:8787` reaches nothing and the LAN never can.
USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8787)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.mjs"]
