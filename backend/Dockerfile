FROM --platform=linux/amd64 golang:1.24-alpine AS builder

RUN apk add --no-cache gcc musl-dev

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o server ./cmd/server

FROM --platform=linux/amd64 alpine:3.19

RUN apk add --no-cache ca-certificates tzdata

# Lambda Web Adapter — bridges Lambda Runtime API to HTTP
# Our Go server runs as a plain HTTP server on :8080
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.8.4 /lambda-adapter /opt/extensions/lambda-adapter

WORKDIR /app

COPY --from=builder /app/server .
COPY --from=builder /app/data/careers.json ./data/careers.json

RUN adduser -D -u 1001 appuser
USER appuser

EXPOSE 8080

ENV CAREERS_JSON_PATH=./data/careers.json
ENV LOG_LEVEL=info
# On Lambda, READINESS_CHECK_PATH and AWS_LAMBDA_EXEC_WRAPPER are
# set automatically by the adapter. Port 8080 is the default target.

# Local dev healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["./server"]
