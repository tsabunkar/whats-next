package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ecr"
	lambdasdk "github.com/aws/aws-sdk-go-v2/service/lambda"
	"github.com/google/go-containerregistry/pkg/authn"
	"github.com/google/go-containerregistry/pkg/name"
	"github.com/google/go-containerregistry/pkg/v1/remote"
)

type SyncPayload struct {
	RepoName string `json:"repo_name"`
	Tag      string `json:"tag"`
}

func handler(ctx context.Context, event events.SQSEvent) error {
	for _, record := range event.Records {
		var payload SyncPayload
		if err := json.Unmarshal([]byte(record.Body), &payload); err != nil {
			log.Printf("Error parsing SQS message: %v", err)
			continue
		}

		log.Printf("Processing sync for repo: %s, tag: %s", payload.RepoName, payload.Tag)

		cfg, err := config.LoadDefaultConfig(ctx)
		if err != nil {
			log.Printf("Error loading AWS config: %v", err)
			return err
		}

		tag := payload.Tag
		if tag == "" {
			tag = "latest"
		}

		if err := syncDockerImageToECR(ctx, cfg, payload.RepoName, tag); err != nil {
			log.Printf("Error syncing Docker image: %v", err)
			return err
		}

		targetLambdaName := os.Getenv("TARGET_LAMBDA_NAME")
		if targetLambdaName == "" {
			log.Println("TARGET_LAMBDA_NAME not set")
			return fmt.Errorf("TARGET_LAMBDA_NAME not set")
		}

		if err := updateLambdaFunction(ctx, cfg, targetLambdaName, tag); err != nil {
			log.Printf("Error updating Lambda function: %v", err)
			return err
		}
	}

	return nil
}

func syncDockerImageToECR(ctx context.Context, cfg aws.Config, repoName, tag string) error {
	log.Printf("Syncing Docker image %s:%s to ECR", repoName, tag)

	ecrClient := ecr.NewFromConfig(cfg)
	authTokenOutput, err := ecrClient.GetAuthorizationToken(ctx, &ecr.GetAuthorizationTokenInput{})
	if err != nil {
		return fmt.Errorf("error getting ECR auth token: %v", err)
	}
	if len(authTokenOutput.AuthorizationData) == 0 {
		return fmt.Errorf("no ECR authorization data")
	}

	ecrToken := *authTokenOutput.AuthorizationData[0].AuthorizationToken
	decoded, err := base64.StdEncoding.DecodeString(ecrToken)
	if err != nil {
		return fmt.Errorf("error decoding ECR token: %v", err)
	}
	parts := strings.SplitN(string(decoded), ":", 2)
	if len(parts) != 2 {
		return fmt.Errorf("invalid ECR token format")
	}

	ecrAuth := authn.FromConfig(authn.AuthConfig{
		Username: parts[0],
		Password: parts[1],
	})

	dockerUser := os.Getenv("DOCKER_USERNAME")
	dockerPass := os.Getenv("DOCKER_PASSWORD")
	var dockerHubAuth authn.Authenticator = authn.Anonymous
	if dockerUser != "" && dockerPass != "" {
		dockerHubAuth = authn.FromConfig(authn.AuthConfig{
			Username: dockerUser,
			Password: dockerPass,
		})
	}

	src := fmt.Sprintf("index.docker.io/%s:%s", repoName, tag)

	ecrRepoURL := os.Getenv("ECR_REPOSITORY_URI")
	if ecrRepoURL == "" {
		return fmt.Errorf("ECR_REPOSITORY_URI not set")
	}
	dst := fmt.Sprintf("%s:%s", ecrRepoURL, tag)

	log.Printf("Copying image from %s to %s", src, dst)

	srcRef, err := name.ParseReference(src)
	if err != nil {
		return fmt.Errorf("error parsing source reference: %v", err)
	}

	dstRef, err := name.ParseReference(dst)
	if err != nil {
		return fmt.Errorf("error parsing destination reference: %v", err)
	}

	img, err := remote.Image(srcRef, remote.WithAuth(dockerHubAuth), remote.WithContext(ctx))
	if err != nil {
		return fmt.Errorf("error pulling image from Docker Hub: %v", err)
	}

	if err := remote.Write(dstRef, img, remote.WithAuth(ecrAuth), remote.WithContext(ctx)); err != nil {
		return fmt.Errorf("error pushing image to ECR: %v", err)
	}

	log.Printf("Docker image %s synced to ECR as %s", src, dst)
	return nil
}

func updateLambdaFunction(ctx context.Context, cfg aws.Config, functionName, tag string) error {
	log.Printf("Updating Lambda function: %s", functionName)

	lambdaClient := lambdasdk.NewFromConfig(cfg)

	ecrRepoURL := os.Getenv("ECR_REPOSITORY_URI")
	if ecrRepoURL == "" {
		return fmt.Errorf("ECR_REPOSITORY_URI not set")
	}

	imageURI := fmt.Sprintf("%s:%s", ecrRepoURL, tag)
	log.Printf("Updating Lambda with ECR image: %s", imageURI)

	_, err := lambdaClient.UpdateFunctionCode(ctx, &lambdasdk.UpdateFunctionCodeInput{
		FunctionName: aws.String(functionName),
		ImageUri:     aws.String(imageURI),
	})
	if err != nil {
		return fmt.Errorf("error updating Lambda function: %v", err)
	}

	log.Printf("Lambda function %s updated successfully with image %s", functionName, imageURI)
	return nil
}

func main() {
	lambda.Start(handler)
}
