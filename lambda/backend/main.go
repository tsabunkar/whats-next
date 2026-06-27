package main

import (
	"context"
	"encoding/json"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

type Response struct {
	StatusCode int            `json:"statusCode"`
	Headers    map[string]string `json:"headers"`
	Body       string         `json:"body"`
}

func handler(ctx context.Context, request events.APIGatewayProxyRequest) (Response, error) {
	log.Println("Received request")

	// Handle the career matching logic here
	// This would typically involve:
	// 1. Parsing the request
	// 2. Processing the career data
	// 3. Returning the matched careers

	response := map[string]interface{}{
		"message": "Career Match API",
		"status":  "success",
	}

	body, err := json.Marshal(response)
	if err != nil {
		log.Printf("Error marshaling response: %v", err)
		return Response{
			StatusCode: 500,
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
			Body: `{"error": "Internal server error"}`,
		}, nil
	}

	return Response{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
		Body: string(body),
	}, nil
}

func main() {
	lambda.Start(handler)
}