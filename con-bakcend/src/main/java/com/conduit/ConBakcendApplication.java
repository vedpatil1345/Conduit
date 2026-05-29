package com.conduit;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;
import com.conduit.config.ConduitProperties;

@SpringBootApplication
@EnableConfigurationProperties(ConduitProperties.class)
@EnableAsync
public class ConBakcendApplication {

    public static void main(String[] args) {
        SpringApplication.run(ConBakcendApplication.class, args);
    }

}
