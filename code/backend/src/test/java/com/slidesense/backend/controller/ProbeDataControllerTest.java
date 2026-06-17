package com.slidesense.backend.controller;

import com.slidesense.backend.dto.probe.FrontendLatestSimpleDTO;
import com.slidesense.backend.dto.probe.FrontendReadingDTO;
import com.slidesense.backend.service.FrontendDataService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.TestingAuthenticationToken;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ProbeDataControllerTest {

    private MockMvc mockMvc;

    @Mock
    private FrontendDataService frontendDataService;

    @InjectMocks
    private ProbeDataController probeDataController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(probeDataController).build();
    }

    @Test
    void getReadings_returnsReadings() throws Exception {
        FrontendReadingDTO reading = new FrontendReadingDTO(
                "probe-1", 10.0, 20.0, "low", 1000L,
                0f, 0f, 0f, 0f, 5f, 0f, 100f, 100f, "normal"
        );

        when(frontendDataService.fetchAllReadings(anyInt(), isNull(), any(), any())).thenReturn(List.of(reading));

        mockMvc.perform(get("/api/v1/probes/readings")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].deviceID").value("probe-1"))
                .andExpect(jsonPath("$.nextToken").isEmpty());
    }

    @Test
    void getMyReadings_returnsMyReadings() throws Exception {
        FrontendReadingDTO reading = new FrontendReadingDTO(
                "probe-2", 10.0, 20.0, "low", 1000L,
                0f, 0f, 0f, 0f, 5f, 0f, 100f, 100f, "normal"
        );

        when(frontendDataService.fetchMyReadings(anyString(), anyInt(), isNull(), any(), any())).thenReturn(List.of(reading));

        Authentication mockPrincipal = new TestingAuthenticationToken("test@example.com", null);

        mockMvc.perform(get("/api/v1/probes/my-readings")
                        .principal(mockPrincipal)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].deviceID").value("probe-2"));
    }

    @Test
    void getLatestSimple_returnsLatest() throws Exception {
        FrontendLatestSimpleDTO latest = new FrontendLatestSimpleDTO(50f, 0f, 5f, 2f, 1000L);

        when(frontendDataService.fetchLatestSimple("probe-1", "test@example.com")).thenReturn(latest);

        Authentication mockPrincipal = new TestingAuthenticationToken("test@example.com", null);

        mockMvc.perform(get("/api/v1/probes/latest")
                        .param("deviceID", "probe-1")
                        .principal(mockPrincipal)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.moisture").value(50f))
                .andExpect(jsonPath("$.tilt").value(5f));
    }

    @Test
    void getLatestSimple_returnsNotFoundWhenNull() throws Exception {
        when(frontendDataService.fetchLatestSimple("probe-1", "test@example.com")).thenReturn(null);

        Authentication mockPrincipal = new TestingAuthenticationToken("test@example.com", null);

        mockMvc.perform(get("/api/v1/probes/latest")
                        .param("deviceID", "probe-1")
                        .principal(mockPrincipal)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }
}
