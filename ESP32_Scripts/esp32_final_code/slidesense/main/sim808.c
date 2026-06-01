#include "sim808.h"

#include <string.h>

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#include "driver/uart.h"
#include "esp_err.h"
#include "esp_log.h"

static const char *TAG = "sim808";

static const uart_port_t SIM808_UART = UART_NUM_2;
static const int SIM808_TX_PIN = 25;
static const int SIM808_RX_PIN = 26;
static const int SIM808_BAUD_RATE = 9600;

static void sim808_init_uart(void)
{
    uart_config_t uart_config = {
        .baud_rate = SIM808_BAUD_RATE,
        .data_bits = UART_DATA_8_BITS,
        .parity = UART_PARITY_DISABLE,
        .stop_bits = UART_STOP_BITS_1,
        .flow_ctrl = UART_HW_FLOWCTRL_DISABLE,
    };

    ESP_ERROR_CHECK(uart_param_config(SIM808_UART, &uart_config));
    ESP_ERROR_CHECK(uart_set_pin(SIM808_UART, SIM808_TX_PIN, SIM808_RX_PIN,
        UART_PIN_NO_CHANGE, UART_PIN_NO_CHANGE));
    ESP_ERROR_CHECK(uart_driver_install(SIM808_UART, 1024, 0, 0, NULL, 0));
}

void sim808_init(void)
{
    sim808_init_uart();
    sim808_send_at("AT");
    sim808_send_at("ATE0");
}

void sim808_send_at(const char *cmd)
{
    uart_write_bytes(SIM808_UART, cmd, strlen(cmd));
    uart_write_bytes(SIM808_UART, "\r\n", 2);

    vTaskDelay(pdMS_TO_TICKS(200));

    uint8_t response[128];
    int len = uart_read_bytes(SIM808_UART, response, sizeof(response) - 1,
        pdMS_TO_TICKS(200));
    if (len > 0) {
        response[len] = '\0';
        ESP_LOGI(TAG, "SIM808: %s", (char *)response);
    }
}
