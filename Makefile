.PHONY: build-lambda-backend build-lambda-worker build-lambdas

build-lambda-backend:
	cd lambda/backend && GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o bootstrap .

build-lambda-worker:
	cd lambda/worker && GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o bootstrap .

build-lambdas: build-lambda-backend build-lambda-worker

package-lambda-backend: build-lambda-backend
	cd lambda/backend && zip -r ../../terraform/lambda_backend.zip bootstrap

package-lambda-worker: build-lambda-worker
	cd lambda/worker && zip -r ../../terraform/lambda_worker.zip bootstrap

package-lambdas: package-lambda-backend package-lambda-worker

clean:
	rm -f terraform/lambda_backend.zip terraform/lambda_worker.zip
	rm -f lambda/backend/bootstrap lambda/worker/bootstrap
