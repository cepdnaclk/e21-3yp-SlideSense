# SlideSense Test Design Document

## 1. Project Modules and Use Cases Review
The SlideSense system consists of several key modules that work together to provide early warning landslide detection and monitoring:
*   **Authentication & Authorization Module**: Handles user registration, login, token generation, and role-based access control (Resident, Researcher, Admin).
*   **Probe Management Module**: Manages the deployment, status tracking, and configuration of IoT sensor probes in the field.
*   **Data Ingestion & Retrieval Module**: Responsible for collecting, storing, and serving sensor readings (moisture, tilt, vibration) from the probes to the frontend dashboards securely.

## 2. Selected Critical Functions
Based on our project's requirements and the test suite we have already implemented, we have selected four critical business logic functions for detailed test modeling. These functions are central to system security, data integrity, and device management:
1.  `AuthService.register(RegisterRequest request)` - Handles new user registration requests and complex role-specific validation.
2.  `AuthService.login(LoginRequest request)` - Manages user authentication, status validation, and JWT issuance.
3.  `FrontendDataService.fetchMyReadings(...)` - Retrieves personalized, secure sensor data for authenticated users based on specific access grants.
4.  `ProbeAdminService.createProbe(CreateProbeRequest request)` - Manages the creation and registration of new IoT hardware probes in the system.

---

## 3. Test Design Techniques Application

### 3.1. Function: `AuthService.register(RegisterRequest request)`
**Assigned Group Member:** [Enter Member 1 Name] - [Enter Index Number]

*   **Equivalence Partitioning:**
    *   **Class 1 (Valid Resident):** `RequestedRole` is `RESIDENT`, provides a valid existing `probeId`. (Representative value: Valid resident details with `probe-123`) ➔ *Expected: Success, user created with pending admin approval status.*
    *   **Class 2 (Valid Researcher):** `RequestedRole` is `RESEARCHER`, `probeId` is null/empty. (Representative value: Valid researcher details without probe) ➔ *Expected: Success, registration request created.*
    *   **Class 3 (Invalid Registration):** Email already exists in the system database. ➔ *Expected: Failure (Exception: "Email is already registered").*
    *   **Class 4 (Invalid Role Combination):** `RequestedRole` is `RESEARCHER`, but provides a `probeId`. ➔ *Expected: Failure (Exception: "probeId must not be provided for researcher requests").*

*   **Boundary Value Analysis (Password & Inputs):**
    *   *Just inside the boundary:* Password length of exactly 8 characters (minimum valid length).
    *   *Exactly on the boundary:* Password length of 7 characters (just below minimum). ➔ *Expected: Validation error / Rejection.*
    *   *Just outside the boundary:* Empty string `""` for mandatory fields like email or name. ➔ *Expected: Validation error.*

*   **Error / Negative Cases:**
    *   Invalid email format (e.g., "test@.com", "user@domain").
    *   Null request payload passed to the function.
    *   Non-existent `probeId` provided by a resident.

*   **External Dependencies to Mock/Stub:**
    *   `UserRepository` (to mock `findByEmail` and `save`)
    *   `ProbeRepository` (to mock `findByProbeId`)
    *   `RegistrationRequestRepository` (to mock `save`)
    *   `PasswordEncoder` (to stub password hashing logic)

---

### 3.2. Function: `AuthService.login(LoginRequest request)`
**Assigned Group Member:** [Enter Member 2 Name] - [Enter Index Number]

*   **Equivalence Partitioning:**
    *   **Class 1 (Valid Credentials, Approved User):** Correct email and password, user registration status is `APPROVED`. ➔ *Expected: Success, returns JWT Access and Refresh tokens.*
    *   **Class 2 (Valid Credentials, Unapproved User):** Correct email and password, but user is disabled/pending admin approval. ➔ *Expected: Failure (Exception: "Account is not approved yet").*
    *   **Class 3 (Invalid Credentials):** Incorrect email or password. ➔ *Expected: Failure (Exception: "Invalid credentials").*

*   **Boundary Value Analysis (Token Expiration & Inputs):**
    *   Testing the JWT generation configuration at exactly the boundary of expiration limits (e.g., exact millisecond limits for access tokens).
    *   Input boundaries: Password string of length 1 vs. completely empty string `""`.

*   **Error / Negative Cases:**
    *   Null or empty email/password in the request payload.
    *   `AuthenticationManager` inherently throwing a `DisabledException` due to locked accounts.
    *   `AuthenticationManager` throwing a `BadCredentialsException`.

*   **External Dependencies to Mock/Stub:**
    *   `UserRepository` (to find user details by email)
    *   `AuthenticationManager` (to stub the actual Spring Security authentication process and simulate exceptions)
    *   `JwtService` (to mock token generation methods and expiration configurations)

---

### 3.3. Function: `FrontendDataService.fetchMyReadings(String email, Integer limit, ...)`
**Assigned Group Member:** [Enter Member 3 Name] - [Enter Index Number]

*   **Equivalence Partitioning:**
    *   **Class 1 (Authorized with Data):** Valid user email, user has an active `ProbeAccessGrant`, and the probe has recorded data in the requested timeframe. ➔ *Expected: Returns a populated list of `FrontendReadingDTO`.*
    *   **Class 2 (Authorized with No Data):** Valid user, has access grant, but no sensor readings exist for that probe in the given timeframe. ➔ *Expected: Returns an empty list `[]`.*
    *   **Class 3 (Unauthorized/Unknown User):** User email does not exist in the database or the user has no valid access grants. ➔ *Expected: Returns an empty list `[]`.*

*   **Boundary Value Analysis (Limit Parameter):**
    *   `limit = 1`: Just inside minimum valid range. ➔ *Expected: Retrieves exactly 1 most recent record.*
    *   `limit = 0` or negative: Just outside valid range. ➔ *Expected: Handled gracefully (either validation error or defaults to a standard limit).*
    *   `limit = MAX_INT` or very high number (e.g., 10000): Upper boundary. ➔ *Expected: Retrieves all available records without crashing the system or times out securely.*

*   **Error / Negative Cases:**
    *   Null email provided to the service layer.
    *   Malformed timestamp filters (if applicable to the overloaded method).
    *   Database connection timeout when fetching extremely large datasets.

*   **External Dependencies to Mock/Stub:**
    *   `UserRepository` (to mock `findByEmail`)
    *   `ProbeAccessGrantRepository` (to mock `findByUser_IdAndRevokedAtIsNull`)
    *   `SensorReadingRepository` (to mock `findByProbe_IdAndRecordedAtBetweenOrderByRecordedAtDesc`)

---

### 3.4. Function: `ProbeAdminService.createProbe(CreateProbeRequest request)`
**Assigned Group Member:** [Enter Member 4 Name] - [Enter Index Number]

*   **Equivalence Partitioning:**
    *   **Class 1 (Valid New Probe):** Unique `probeId` and unique `hwSerial` provided with valid coordinates. ➔ *Expected: Success, probe saved to database.*
    *   **Class 2 (Duplicate Probe ID):** `probeId` already exists in the system. ➔ *Expected: Failure (Exception: "Probe ID already exists").*
    *   **Class 3 (Duplicate Hardware Serial):** `hwSerial` already exists for another probe. ➔ *Expected: Failure (Exception: "Hardware Serial already exists").*

*   **Boundary Value Analysis (Coordinates & Inputs):**
    *   *Latitude & Longitude boundaries:* Testing exact maximum/minimum coordinate values (e.g., Latitude 90.0 and -90.0, Longitude 180.0 and -180.0).
    *   *Input boundaries:* Empty strings `""` for `probeId` or `hwSerial`. ➔ *Expected: Validation error.*

*   **Error / Negative Cases:**
    *   Null request payload.
    *   Missing mandatory fields in `CreateProbeRequest` (e.g., status is null).
    *   Database connection issues during repository save.

*   **External Dependencies to Mock/Stub:**
    *   `ProbeRepository` (to mock `findByProbeId`, `findByHwSerial`, and `save` methods)

---
*Note to team: Please update the [Enter Member Name] and [Enter Index Number] placeholders with your actual details before submission.*
