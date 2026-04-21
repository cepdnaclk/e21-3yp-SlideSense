package com.slidesense.backend.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI slideSenseOpenApi(@Value("${security.api-key.header:X-API-Key}") String apiKeyHeader) {
        return new OpenAPI()
            .info(new Info().title("SlideSense API").version("v1").description("SlideSense backend API documentation"))
            .components(
                new Components()
                    .addSecuritySchemes(
                        "bearerAuth",
                        new SecurityScheme()
                            .type(SecurityScheme.Type.HTTP)
                            .scheme("bearer")
                            .bearerFormat("JWT")
                    )
                    .addSecuritySchemes(
                        "apiKeyAuth",
                        new SecurityScheme()
                            .type(SecurityScheme.Type.APIKEY)
                            .name(apiKeyHeader)
                            .in(SecurityScheme.In.HEADER)
                    )
            );
    }
}
