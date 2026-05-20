package com.slidesense.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.DeleteMessageRequest;
import software.amazon.awssdk.services.sqs.model.Message;
import software.amazon.awssdk.services.sqs.model.ReceiveMessageRequest;

@Service
@ConditionalOnProperty(prefix = "integration.aws.sqs.ingestion", name = "enabled", havingValue = "true")
public class SqsPollingService {

    private static final Logger log = LoggerFactory.getLogger(SqsPollingService.class);

    private final SqsClient sqsClient;
    private final SqsIngestionService sqsIngestionService;
    private final String queueUrl;
    private final int maxMessages;
    private final int waitTimeSeconds;

    public SqsPollingService(
        SqsClient sqsClient,
        SqsIngestionService sqsIngestionService,
        @Value("${integration.aws.sqs.ingestion.queue-url}") String queueUrl,
        @Value("${integration.aws.sqs.ingestion.max-messages:10}") int maxMessages,
        @Value("${integration.aws.sqs.ingestion.wait-time-seconds:10}") int waitTimeSeconds
    ) {
        this.sqsClient = sqsClient;
        this.sqsIngestionService = sqsIngestionService;
        this.queueUrl = queueUrl;
        this.maxMessages = maxMessages;
        this.waitTimeSeconds = waitTimeSeconds;
    }

    @Scheduled(fixedDelayString = "${integration.aws.sqs.ingestion.poll-delay-ms:2000}")
    public void poll() {
        if (queueUrl == null || queueUrl.isBlank()) {
            log.warn("SQS ingestion is enabled but queue-url is empty; skipping poll cycle");
            return;
        }

        ReceiveMessageRequest request = ReceiveMessageRequest
            .builder()
            .queueUrl(queueUrl)
            .maxNumberOfMessages(Math.min(Math.max(maxMessages, 1), 10))
            .waitTimeSeconds(Math.max(waitTimeSeconds, 0))
            .build();

        for (Message message : sqsClient.receiveMessage(request).messages()) {
            processSingleMessage(message);
        }
    }

    private void processSingleMessage(Message message) {
        try {
            sqsIngestionService.processPayload(message.body());
            sqsClient.deleteMessage(
                DeleteMessageRequest.builder().queueUrl(queueUrl).receiptHandle(message.receiptHandle()).build()
            );
        } catch (Exception ex) {
            // Leave the message in queue for retry and DLQ handling by SQS redrive policy.
            log.error("Failed to process SQS message {}: {}", message.messageId(), ex.getMessage(), ex);
        }
    }
}
