package com.conduit;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import com.conduit.config.ConduitProperties;

@SpringBootApplication
@EnableConfigurationProperties(ConduitProperties.class)
public class ConBakcendApplication {

    public static void main(String[] args) {
        SpringApplication.run(ConBakcendApplication.class, args);
    }

}
