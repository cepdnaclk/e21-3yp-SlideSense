idf_component_register(SRCS "main.c" "sim808.c" "gps.c"
                       INCLUDE_DIRS "."
                       EMBED_TXTFILES
                           "certs/AmazonRootCA1.pem"
                           "certs/device_cert.pem"
                           "certs/device_key.pem"
                       REQUIRES esp_adc esp_driver_gpio esp_driver_uart esp_timer
                                esp_event esp_netif esp_modem mqtt mbedtls nvs_flash)
