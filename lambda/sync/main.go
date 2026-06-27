package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
)

type DockerHubWebhook struct {
	PushData struct {
		Tag string `json:"tag"`
	} `json:"push_data"`
	Repository struct {
		RepoName string `json:"repo_name"`
	} `json:"repository"`
}

func handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Println("Received Docker Hub webhook")

	var webhook DockerHubWebhook
	if err := json.Unmarshal([]byte(request.Body), &webhook); err != nil {
		log.Printf("Error parsing webhook: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       fmt.Sprintf("Error parsing webhook: %v", err),
		}, nil
	}

	log.Printf("Webhook for repo: %s, tag: %s", webhook.Repository.RepoName, webhook.PushData.Tag)

	if webhook.Repository.RepoName != "tsabunkar/whats-next-backend" {
		log.Println("Not our repository, ignoring")
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Body:       "Not our repository, ignoring",
		}, nil
	}

	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		log.Printf("Error loading AWS config: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       fmt.Sprintf("Error loading AWS config: %v", err),
		}, nil
	}

	tag := webhook.PushData.Tag
	if tag == "" {
		tag = "latest"
	}

	queueURL := os.Getenv("SQS_QUEUE_URL")
	if queueURL == "" {
		log.Println("SQS_QUEUE_URL not set")
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       "SQS_QUEUE_URL not set",
		}, nil
	}

	messageBody, err := json.Marshal(map[string]string{
		"repo_name": webhook.Repository.RepoName,
		"tag":       tag,
	})
	if err != nil {
		log.Printf("Error marshaling message: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       fmt.Sprintf("Error marshaling message: %v", err),
		}, nil
	}

	sqsClient := sqs.NewFromConfig(cfg)
	_, err = sqsClient.SendMessage(ctx, &sqs.SendMessageInput{
		QueueUrl:    &queueURL,
		MessageBody: aws.String(string(messageBody)),
	})
	if err != nil {
		log.Printf("Error sending message to SQS: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       fmt.Sprintf("Error sending message to SQS: %v", err),
		}, nil
	}

	log.Printf("Successfully queued sync for %s:%s", webhook.Repository.RepoName, tag)
	return events.APIGatewayProxyResponse{
		StatusCode: 202,
		Body:       "Sync queued",
	}, nil
}

func main() {
	lambda.Start(handler)
}
