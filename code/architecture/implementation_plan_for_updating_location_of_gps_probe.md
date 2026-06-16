# Dynamic GPS Coordinates Update & Location Error Detection

## Background Context
Currently, probe coordinates (latitude and longitude) are only set/updated when the probe is initially created or when manually updated by an administrator via the map coordinate editor. GPS coordinates sent in probe telemetry readings are not tracked or saved.

We want to:
1. Automatically update the probe's location in the database when new telemetry readings arrive.
2. Detect if there is a "huge change" in coordinate values (exceeding a threshold of 0.01 degrees, i.e., ~1.1km).
3. If a huge change is detected, transition the probe status to `LOCATION_ERROR`, skip updating the coordinates, and make this visible in the frontend admin dashboard.
4. If the coordinates return to normal (within threshold), update them and revert status back to `ONLINE`.

---

## Proposed Changes

### Backend

#### [MODIFY] [ProbeStatus.java](file:///home/fikry/dev/e21-3yp-SlideSense/code/backend/src/main/java/com/slidesense/backend/model/enums/ProbeStatus.java)
- Add `LOCATION_ERROR` to the enum of probe statuses.

#### [MODIFY] [SqsSensorReadingMessage.java](file:///home/fikry/dev/e21-3yp-SlideSense/code/backend/src/main/java/com/slidesense/backend/dto/ingestion/SqsSensorReadingMessage.java)
- Add `latitude` and `longitude` fields to the SQS message record with `@JsonAlias` annotation supporting `lat`, `lng`, `latitude`, and `longitude`.

#### [MODIFY] [FrontendReadingDTO.java](file:///home/fikry/dev/e21-3yp-SlideSense/code/backend/src/main/java/com/slidesense/backend/dto/probe/FrontendReadingDTO.java)
- Add a `String status` field to the DTO so the frontend can receive the probe's current status (including `LOCATION_ERROR`).

#### [MODIFY] [FrontendDataService.java](file:///home/fikry/dev/e21-3yp-SlideSense/code/backend/src/main/java/com/slidesense/backend/service/FrontendDataService.java)
- Update instantiations of `FrontendReadingDTO` to populate the `status` field using `probe.getStatus().name()`.

#### [MODIFY] [SqsIngestionService.java](file:///home/fikry/dev/e21-3yp-SlideSense/code/backend/src/main/java/com/slidesense/backend/service/SqsIngestionService.java)
- In `processMessage`, if `message.latitude()` and `message.longitude()` are present:
  - If existing coordinates exist on the `Probe`:
    - Calculate absolute coordinate differences `diffLat` and `diffLng`.
    - If `diffLat > 0.01 || diffLng > 0.01`, set probe status to `LOCATION_ERROR`.
    - Otherwise, update probe's latitude and longitude and, if status was `LOCATION_ERROR`, revert it to `ONLINE`.
  - If no existing coordinates, update them directly and reset `LOCATION_ERROR` status if set.
  - Save the updated `Probe` entity.

#### [NEW] [SqsIngestionServiceTest.java](file:///home/fikry/dev/e21-3yp-SlideSense/code/backend/src/test/java/com/slidesense/backend/service/SqsIngestionServiceTest.java)
- Write unit tests for `SqsIngestionService` covering:
  - Coordinate update when no existing coordinates are present.
  - Normal coordinate update (within threshold).
  - Transition to `LOCATION_ERROR` when coordinate shift exceeds threshold.
  - Recovery to `ONLINE` and coordinate update when shifts fall back within threshold.

---

### Frontend

#### [MODIFY] [nodeService.js](file:///home/fikry/dev/e21-3yp-SlideSense/code/frontend-new/src/services/api/nodeService.js)
- Map the new `status` field from the reading data to the returned probe object.

#### [MODIFY] [NodesTab.jsx](file:///home/fikry/dev/e21-3yp-SlideSense/code/frontend-new/src/pages/admin/tabs/NodesTab.jsx)
- In the registered nodes table, render "Location Error" in red if `probe.status === 'LOCATION_ERROR'`.

#### [MODIFY] [ProbeDetailsPanel.jsx](file:///home/fikry/dev/e21-3yp-SlideSense/code/frontend-new/src/components/admin/ProbeDetailsPanel.jsx)
- Display a prominent error banner in the details panel when the selected probe has `status === 'LOCATION_ERROR'`.

---

## Verification Plan

### Automated Tests
- Run Backend unit/integration tests to verify that compilation and logic are correct:
  ```bash
  mvn test
  ```

### Manual Verification
- Trigger an HTTP ingestion message using `curl` with standard coordinates, and verify that the location coordinates update correctly on the database/frontend.
- Trigger an HTTP ingestion message with a large coordinate change, and verify that:
  - Status transitions to `LOCATION_ERROR`.
  - Coordinates are not modified.
  - The frontend displays "Location Error" on the nodes list and the details panel.
