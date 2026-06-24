FROM golang:1.22-alpine AS builder

RUN apk add --no-cache gcc musl-dev

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o server ./cmd/server

FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

COPY --from=builder /app/server .
COPY --from=builder /app/data/careers.json ./data/careers.json

RUN adduser -D -u 1001 appuser
USER appuser

EXPOSE 8080

ENV CAREERS_JSON_PATH=./data/careers.json
ENV LOG_LEVEL=info
# ENV ADZUNA_APP_ID=<your-app-id>
# ENV ADZUNA_APP_KEY=<your-app-key>

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["./server"]
