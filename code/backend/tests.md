# Backend Testing Walkthrough

I have successfully added a comprehensive suite of unit and integration tests for the core authentication and data retrieval layers of the backend. 

All 25 tests in the suite are now passing successfully!

## What Was Added

### 1. Services (Unit Tests)
We added isolated unit tests for the core business logic using JUnit 5 and Mockito. This ensures the services behave correctly under various conditions without needing a database connection.

- **[AuthServiceTest.java](file:///home/fikry/dev/e21-3yp-SlideSense/code/backend/src/test/java/com/slidesense/backend/service/AuthServiceTest.java)**
  - `register`: Verified successful registration flows, prevention of duplicate emails, and constraints (e.g., researchers cannot provide probe IDs).
  - `login`: Verified successful authentication, proper token generation, and correct handling of disabled accounts or bad credentials.
  - `refresh`: Verified refresh token extraction, validation, and issuance of new JWT tokens.
- **[FrontendDataServiceTest.java](file:///home/fikry/dev/e21-3yp-SlideSense/code/backend/src/test/java/com/slidesense/backend/service/FrontendDataServiceTest.java)**
  - `fetchAllReadings`: Verified that the service correctly fetches readings for all active probes.
  - `fetchMyReadings`: Verified that users only receive readings for probes they have explicit access grants for.
  - `fetchLatestSimple`: Verified the logic for fetching the most recent simplified sensor reading.

### 2. Controllers (Slice Tests)
We added integration tests for the REST API endpoints using `MockMvcBuilders.standaloneSetup()`. This approach bypasses the full Spring context (and security filters), making the tests extremely fast while still validating JSON serialization, HTTP status codes, and endpoint routing.

- **[AuthControllerTest.java](file:///home/fikry/dev/e21-3yp-SlideSense/code/backend/src/test/java/com/slidesense/backend/controller/AuthControllerTest.java)**
  - Verified POST requests to `/auth/register`, `/auth/login`, `/auth/refresh`, and `/auth/logout`.
  - Asserted that the JSON response bodies contain the correct fields (e.g., `accessToken`, `user.role`, `message`).
- **[ProbeDataControllerTest.java](file:///home/fikry/dev/e21-3yp-SlideSense/code/backend/src/test/java/com/slidesense/backend/controller/ProbeDataControllerTest.java)**
  - Verified GET requests to `/api/v1/probes/readings`, `/api/v1/probes/my-readings`, and `/api/v1/probes/latest`.
  - Used `TestingAuthenticationToken` to mock the authenticated user principal.
  - Asserted the structure of the JSON responses.

## Validation Results

> [!TIP]
> **Build Success**
> Running `./mvnw test -Dtest=AuthServiceTest,FrontendDataServiceTest,AuthControllerTest,ProbeDataControllerTest,ProbeAdminServiceTest,AlertControllerTest` resulted in a successful execution of all 25 tests in just under 8 seconds.

```text
[INFO] Tests run: 25, Failures: 0, Errors: 0, Skipped: 0
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```
