#!/bin/bash
set -euo pipefail

awslocal sqs create-queue --queue-name article-index

echo "LocalStack: fila SQS 'article-index' criada."
