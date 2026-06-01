#include <stdio.h>
#include <stdint.h>
#include <string.h>

#include "freertos/FreeRTOS.h"
#include "freertos/event_groups.h"
#include "freertos/task.h"

#include "driver/uart.h"

#include "esp_err.h"
#include "esp_event.h"
#include "esp_log.h"
#include "esp_netif.h"
#include "esp_netif_defaults.h"
#include "esp_netif_ppp.h"
#include "esp_tls.h"
#include "mqtt_client.h"
#include "nvs_flash.h"

#include "esp_modem_api.h"
#include "esp_modem_c_api_types.h"
#include "esp_modem_config.h"
#include "esp_modem_dce_config.h"

static const char *TAG = "slidesense";

static const char *PPP_APN = "mobitel";
static const char *MQTT_BROKER_URI =
    "mqtts://a1cvrohkom2hp3-ats.iot.ap-south-1.amazonaws.com:8883";
static const char *MQTT_CLIENT_ID = "slidesense-esp32";
static const char *MQTT_TOPIC = "slidesense/test";

static const char *MQTT_SAMPLE_PAYLOAD =
    "{\"device_id\":\"ESP32\",\"moisture\":[12.3,45.6,78.9],"
    "\"rain_mm\":0.0,\"gps\":{\"lat\":7.1234,\"lon\":80.5678}}";

extern const uint8_t _binary_certs_AmazonRootCA1_pem_start[]
    asm("_binary_certs_AmazonRootCA1_pem_start");
extern const uint8_t _binary_certs_device_cert_pem_start[]
    asm("_binary_certs_device_cert_pem_start");
extern const uint8_t _binary_certs_device_key_pem_start[]
    asm("_binary_certs_device_key_pem_start");

static EventGroupHandle_t s_ppp_event_group;
static esp_netif_t *s_ppp_netif;
static esp_mqtt_client_handle_t s_mqtt_client;
static esp_modem_dce_t *s_modem_dce;

#define PPP_CONNECTED_BIT BIT0

#if 0
#include "sim808.h"

#include "esp_adc/adc_oneshot.h"
#include "esp_timer.h"

#include "driver/gpio.h"

#include "gps.h"
#endif

#if 0
// Timing intervals.
static const int POLL_INTERVAL_MS = 1000;
static const int LOG_INTERVAL_MS = 5000;

// Rain gauge (tipping bucket) configuration.
static const gpio_num_t RAIN_GAUGE_GPIO = GPIO_NUM_27;
static const float RAIN_MM_PER_TIP = 0.2f;
static const int64_t RAIN_DEBOUNCE_US = 5000;

// Soil moisture ADC configuration (GPIO32/33/34 on ESP32 by default).
#define SOIL_SENSOR_COUNT 3
static const adc_channel_t SOIL_ADC_CHANNELS[SOIL_SENSOR_COUNT] = {
    ADC_CHANNEL_4, // GPIO32
    ADC_CHANNEL_5, // GPIO33
    ADC_CHANNEL_6, // GPIO34
};
static const int SOIL_MOISTURE_DRY_RAW[SOIL_SENSOR_COUNT] = { 3000, 3000, 3000 };
static const int SOIL_MOISTURE_WET_RAW[SOIL_SENSOR_COUNT] = { 1200, 1200, 1200 };

static volatile uint32_t g_rain_tips_total = 0;
static volatile int64_t g_last_tip_us = 0;
static portMUX_TYPE g_rain_lock = portMUX_INITIALIZER_UNLOCKED;

static adc_oneshot_unit_handle_t g_soil_adc_handle;

static inline int64_t now_ms(void)
{
    return esp_timer_get_time() / 1000;
}

static void IRAM_ATTR rain_tip_isr(void *arg)
{
    int64_t now_us = esp_timer_get_time();
    if (now_us - g_last_tip_us < RAIN_DEBOUNCE_US) {
        return;
    }
    g_last_tip_us = now_us;

    portENTER_CRITICAL_ISR(&g_rain_lock);
    g_rain_tips_total++;
    portEXIT_CRITICAL_ISR(&g_rain_lock);
}

static uint32_t get_total_tips(void)
{
    uint32_t total;

    portENTER_CRITICAL(&g_rain_lock);
    total = g_rain_tips_total;
    portEXIT_CRITICAL(&g_rain_lock);

    return total;
}

static void init_rain_gauge(void)
{
    gpio_config_t io_conf = {
        .pin_bit_mask = 1ULL << RAIN_GAUGE_GPIO,
        .mode = GPIO_MODE_INPUT,
        .pull_up_en = GPIO_PULLUP_ENABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .intr_type = GPIO_INTR_POSEDGE,
    };

    ESP_ERROR_CHECK(gpio_config(&io_conf));

    esp_err_t err = gpio_install_isr_service(ESP_INTR_FLAG_IRAM);
    if (err != ESP_OK && err != ESP_ERR_INVALID_STATE) {
        ESP_ERROR_CHECK(err);
    }

    ESP_ERROR_CHECK(gpio_isr_handler_add(RAIN_GAUGE_GPIO, rain_tip_isr, NULL));
}

static float read_rainfall_mm(uint32_t *last_tip_count)
{
    uint32_t current = get_total_tips();
    uint32_t delta = current - *last_tip_count;
    *last_tip_count = current;

    return (float)delta * RAIN_MM_PER_TIP;
}

static void init_soil_moisture_adc(void)
{
    adc_oneshot_unit_init_cfg_t init_config = {
        .unit_id = ADC_UNIT_1,
        .ulp_mode = ADC_ULP_MODE_DISABLE,
    };

    ESP_ERROR_CHECK(adc_oneshot_new_unit(&init_config, &g_soil_adc_handle));

    adc_oneshot_chan_cfg_t chan_config = {
        .bitwidth = ADC_BITWIDTH_12,
        .atten = ADC_ATTEN_DB_12,
    };

    for (size_t i = 0; i < SOIL_SENSOR_COUNT; i++) {
        ESP_ERROR_CHECK(adc_oneshot_config_channel(g_soil_adc_handle, SOIL_ADC_CHANNELS[i], &chan_config));
    }
}

static float read_soil_moisture_pct(size_t index)
{
    int raw = 0;
    if (index >= SOIL_SENSOR_COUNT) {
        return 0.0f;
    }

    esp_err_t err = adc_oneshot_read(g_soil_adc_handle, SOIL_ADC_CHANNELS[index], &raw);
    if (err != ESP_OK) {
        ESP_LOGW(TAG, "ADC read failed (sensor %u): %s", (unsigned)index, esp_err_to_name(err));
        return 0.0f;
    }

    if (SOIL_MOISTURE_DRY_RAW[index] == SOIL_MOISTURE_WET_RAW[index]) {
        return 0.0f;
    }

    float pct = ((float)(SOIL_MOISTURE_DRY_RAW[index] - raw)
        / (float)(SOIL_MOISTURE_DRY_RAW[index] - SOIL_MOISTURE_WET_RAW[index])) * 100.0f;

    if (pct < 0.0f) {
        pct = 0.0f;
    } else if (pct > 100.0f) {
        pct = 100.0f;
    }

    return pct;
}

static void sensor_task(void *arg)
{
    uint32_t last_tip_count = 0;
    float rainfall_since_log = 0.0f;
    int64_t last_log_ms = now_ms();

    while (true) {
        rainfall_since_log += read_rainfall_mm(&last_tip_count);
        float soil_pct[SOIL_SENSOR_COUNT] = { 0 };
        for (size_t i = 0; i < SOIL_SENSOR_COUNT; i++) {
            soil_pct[i] = read_soil_moisture_pct(i);
        }

        int64_t now = now_ms();
        if (now - last_log_ms >= LOG_INTERVAL_MS) {
            ESP_LOGI(TAG, "rain_mm=%.2f soil_pct=[%.1f %.1f %.1f] tips_total=%u",
                rainfall_since_log, soil_pct[0], soil_pct[1], soil_pct[2], get_total_tips());
            sim808_send_at("AT");
            gps_request_fix();

            rainfall_since_log = 0.0f;
            last_log_ms = now;
        }

        vTaskDelay(pdMS_TO_TICKS(POLL_INTERVAL_MS));
    }
}

// SIM-only test payload (adjust to match your backend format).
static const char *SIM_SAMPLE_PAYLOAD =
    "{\"device_id\":\"ESP32\",\"moisture\":[12.3,45.6,78.9],"
    "\"rain_mm\":0.0,\"gps\":{\"lat\":7.1234,\"lon\":80.5678}}";

static void sim_test_task(void *arg)
{
    while (true) {
        sim808_send_at("AT");
        sim808_send_at("AT+CSQ");
        ESP_LOGI(TAG, "sample_payload=%s", SIM_SAMPLE_PAYLOAD);
        vTaskDelay(pdMS_TO_TICKS(5000));
    }
}
#endif

static void ppp_event_handler(void *arg, esp_event_base_t event_base,
    int32_t event_id, void *event_data)
{
    if (event_base == IP_EVENT && event_id == IP_EVENT_PPP_GOT_IP) {
        ESP_LOGI(TAG, "PPP connected");
        xEventGroupSetBits(s_ppp_event_group, PPP_CONNECTED_BIT);
    } else if (event_base == IP_EVENT && event_id == IP_EVENT_PPP_LOST_IP) {
        ESP_LOGW(TAG, "PPP disconnected");
        xEventGroupClearBits(s_ppp_event_group, PPP_CONNECTED_BIT);
    }
}

static void mqtt_event_handler(void *handler_args, esp_event_base_t event_base,
    int32_t event_id, void *event_data)
{
    esp_mqtt_event_handle_t event = event_data;

    if (event->event_id == MQTT_EVENT_CONNECTED) {
        ESP_LOGI(TAG, "MQTT connected");
        esp_mqtt_client_publish(s_mqtt_client, MQTT_TOPIC,
            MQTT_SAMPLE_PAYLOAD, 0, 1, 0);
    } else if (event->event_id == MQTT_EVENT_DISCONNECTED) {
        ESP_LOGW(TAG, "MQTT disconnected");
    }
}

static void start_ppp_modem(void)
{
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ESP_ERROR_CHECK(nvs_flash_init());
    } else {
        ESP_ERROR_CHECK(ret);
    }

    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());

    s_ppp_event_group = xEventGroupCreate();
    ESP_ERROR_CHECK(esp_event_handler_register(IP_EVENT, ESP_EVENT_ANY_ID,
        &ppp_event_handler, NULL));

    esp_netif_config_t cfg = ESP_NETIF_DEFAULT_PPP();
    s_ppp_netif = esp_netif_new(&cfg);

    esp_modem_dte_config_t dte_config = ESP_MODEM_DTE_DEFAULT_CONFIG();
    dte_config.uart_config.port_num = UART_NUM_2;
    dte_config.uart_config.baud_rate = 115200;
    dte_config.uart_config.tx_io_num = 25;
    dte_config.uart_config.rx_io_num = 26;
    dte_config.uart_config.rts_io_num = UART_PIN_NO_CHANGE;
    dte_config.uart_config.cts_io_num = UART_PIN_NO_CHANGE;

    esp_modem_dce_config_t dce_config = ESP_MODEM_DCE_DEFAULT_CONFIG(PPP_APN);
    s_modem_dce = esp_modem_new_dev(ESP_MODEM_DCE_SIM800, &dte_config, &dce_config, s_ppp_netif);
    ESP_ERROR_CHECK(esp_modem_set_mode(s_modem_dce, ESP_MODEM_MODE_DATA));
}

static void start_mqtt_client(void)
{
    esp_mqtt_client_config_t mqtt_cfg = {
        .broker = {
            .address.uri = MQTT_BROKER_URI,
            .verification.certificate = (const char *)_binary_certs_AmazonRootCA1_pem_start,
        },
        .credentials = {
            .authentication = {
                .certificate = (const char *)_binary_certs_device_cert_pem_start,
                .key = (const char *)_binary_certs_device_key_pem_start,
            },
            .client_id = MQTT_CLIENT_ID,
        },
    };

    s_mqtt_client = esp_mqtt_client_init(&mqtt_cfg);
    esp_mqtt_client_register_event(s_mqtt_client, ESP_EVENT_ANY_ID,
        mqtt_event_handler, NULL);
    esp_mqtt_client_start(s_mqtt_client);
}

void app_main(void)
{
    start_ppp_modem();
    xEventGroupWaitBits(s_ppp_event_group, PPP_CONNECTED_BIT,
        pdFALSE, pdTRUE, portMAX_DELAY);
    start_mqtt_client();
}
