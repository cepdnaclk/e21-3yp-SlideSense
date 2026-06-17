package com.slidesense.backend.controller;

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

import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AlertControllerTest {

    private MockMvc mockMvc;

    @Mock
    private FrontendDataService frontendDataService;

    @InjectMocks
    private AlertController alertController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(alertController).build();
    }

    @Test
    void getAlerts_returnsFilteredCriticalAlerts() throws Exception {
        // Arrange
        FrontendReadingDTO normalReading = new FrontendReadingDTO(
                "device-1", 10.0, 20.0, "Low", 1718182400000L,
                0.1f, 0.2f, 0.3f, 0.2f, 5.0f, 0.1f, 3.3f, -70.0f, "NORMAL"
        );
        FrontendReadingDTO criticalReading = new FrontendReadingDTO(
                "device-2", 11.0, 21.0, "High", 1718182400000L,
                0.1f, 0.2f, 0.3f, 0.2f, 20.0f, 0.5f, 3.3f, -70.0f, "ALERT"
        );

        when(frontendDataService.fetchAllReadings(eq(200), any(), any(), any())).thenReturn(List.of(normalReading, criticalReading));

        // Act & Assert
        mockMvc.perform(get("/api/v1/alerts")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is("device-2-movement")))
                .andExpect(jsonPath("$[0].severity", is("Critical")))
                .andExpect(jsonPath("$[0].node", is("device-2")));
    }
}
