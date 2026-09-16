package com.untold.backend.configs;
import com.untold.backend.model.*;
import com.untold.backend.repository.*;
import com.untold.backend.service.*;


import org.flywaydb.core.Flyway;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
public class FlywayConfig {

    @Bean(initMethod = "migrate")
    public Flyway flyway(DataSource dataSource) {
        return Flyway.configure()
                .baselineOnMigrate(true)
                .baselineVersion("0")
                .locations("classpath:db/migration")
                .dataSource(dataSource)
                .validateOnMigrate(false)
                .load();
    }
}
