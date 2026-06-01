package com.slidesense.dynamodbbackend.service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.slidesense.dynamodbbackend.dto.LandslidePageResponse;
import com.slidesense.dynamodbbackend.dto.LandslideReadingResponse;

import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.QueryRequest;
import software.amazon.awssdk.services.dynamodb.model.ScanRequest;
import software.amazon.awssdk.services.dynamodb.model.ScanResponse;

@Service
public class LandslideService {

    private final DynamoDbClient ddb;
    private final String tableName;

    public LandslideService(
            DynamoDbClient ddb,
            @Value("${app.dynamodb.table-name:LandslideData}") String tableName
    ) {
        this.ddb = ddb;
        this.tableName = tableName;
    }

    public Optional<LandslideReadingResponse> getLatestReading(String deviceID) {
        QueryRequest request = QueryRequest.builder()
                .tableName(tableName)
                .keyConditionExpression("deviceID = :id")
                .expressionAttributeValues(Map.of(":id", AttributeValue.builder().s(deviceID).build()))
                .scanIndexForward(false)
                .limit(1)
                .build();

        List<Map<String, AttributeValue>> items = ddb.query(request).items();
        if (items == null || items.isEmpty()) {
            return Optional.empty();
        }

        return Optional.of(mapToResponse(items.get(0)));
    }

    public LandslidePageResponse getAllData(int limit, String nextToken) {
        ScanRequest.Builder requestBuilder = ScanRequest.builder()
                .tableName(tableName)
                .limit(limit);

        if (nextToken != null && !nextToken.isBlank()) {
            requestBuilder.exclusiveStartKey(decodeNextToken(nextToken));
        }

        ScanResponse response = ddb.scan(requestBuilder.build());
        List<LandslideReadingResponse> items = response.items()
                .stream()
                .map(LandslideService::mapToResponse)
                .toList();

        String responseNextToken = null;
        if (response.lastEvaluatedKey() != null && !response.lastEvaluatedKey().isEmpty()) {
            responseNextToken = encodeNextToken(response.lastEvaluatedKey());
        }

        return new LandslidePageResponse(items, responseNextToken, items.size());
    }

    private static String encodeNextToken(Map<String, AttributeValue> lastEvaluatedKey) {
        String deviceId = getString(lastEvaluatedKey, "deviceID");
        String timestamp = getString(lastEvaluatedKey, "timestamp");
        String raw = deviceId + "|" + timestamp;
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    private static Map<String, AttributeValue> decodeNextToken(String token) {
        try {
            String decoded = new String(Base64.getUrlDecoder().decode(token), StandardCharsets.UTF_8);
            String[] parts = decoded.split("\\|", 2);
            if (parts.length != 2 || parts[0].isBlank() || parts[1].isBlank()) {
                throw new IllegalArgumentException("Invalid nextToken format");
            }

            Map<String, AttributeValue> key = new HashMap<>();
            key.put("deviceID", AttributeValue.builder().s(parts[0]).build());
            key.put("timestamp", AttributeValue.builder().n(parts[1]).build());
            return key;
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid nextToken", ex);
        }
    }

    private static LandslideReadingResponse mapToResponse(Map<String, AttributeValue> item) {
        double m1 = getNumber(item, "m1");
        double m2 = getNumber(item, "m2");
        double m3 = getNumber(item, "m3");
        double avg = hasNumber(item, "avg_moisture") ? getNumber(item, "avg_moisture") : (m1 + m2 + m3) / 3.0;
        int tilt = (int) getNumber(item, "tilt");

        return new LandslideReadingResponse(
                getString(item, "deviceID"),
                (long) getNumber(item, "timestamp"),
                m1,
                m2,
                m3,
                avg,
                getNumber(item, "rain"),
                tilt,
                getString(item, "risk"),
                getNumber(item, "lat"),
                getNumber(item, "lng"),
                tilt == 1
        );
    }

    private static String getString(Map<String, AttributeValue> item, String key) {
        AttributeValue value = item.get(key);
        if (value == null) {
            return "";
        }

        if (value.s() != null) {
            return value.s();
        }

        if (value.n() != null) {
            return value.n();
        }

        return "";
    }

    private static boolean hasNumber(Map<String, AttributeValue> item, String key) {
        AttributeValue value = item.get(key);
        return value != null && value.n() != null;
    }

    private static double getNumber(Map<String, AttributeValue> item, String key) {
        AttributeValue value = item.get(key);
        if (value == null || value.n() == null || value.n().isBlank()) {
            return 0.0;
        }
        return Double.parseDouble(value.n());
    }
}
