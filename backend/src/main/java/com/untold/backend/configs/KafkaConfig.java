package com.untold.backend.configs;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {

    public static final String ENTRANCE_EVENTS_TOPIC = "entrance-events";
    public static final String TICKET_EVENTS_TOPIC = "ticket-events";

    @Bean
    public NewTopic entranceEventsTopic() {
        // Single partition keeps events globally ordered — entrance counts are a single stream,
        // and out-of-order "3 inside" after "4 inside" would flicker wrong numbers in the UI.
        return TopicBuilder.name(ENTRANCE_EVENTS_TOPIC).partitions(1).replicas(1).build();
    }

    @Bean
    public NewTopic ticketEventsTopic() {
        return TopicBuilder.name(TICKET_EVENTS_TOPIC).partitions(1).replicas(1).build();
    }
}
