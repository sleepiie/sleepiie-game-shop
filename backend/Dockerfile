# Build stage
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/main.go

# Final stage
FROM alpine:3.22

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/main .

RUN apk add --no-cache ca-certificates

EXPOSE 8080

CMD ["./main"]
