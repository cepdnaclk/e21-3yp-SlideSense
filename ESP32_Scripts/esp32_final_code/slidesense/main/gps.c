#include "gps.h"

#include "esp_log.h"
#include "sim808.h"

static const char *TAG = "gps";

void gps_init(void)
{
    sim808_send_at("AT+CGNSPWR=1");
    ESP_LOGI(TAG, "GPS power on requested");
}

void gps_request_fix(void)
{
    sim808_send_at("AT+CGNSINF");
}
