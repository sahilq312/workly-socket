FROM oven/bun

WORKDIR /app

COPY . .

RUN bun install

EXPOSE 8000

ENTRYPOINT [ "bun", "run", "start" ]