package com.untold.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.untold.backend.configs.KafkaConfig;
import org.springframework.context.annotation.Lazy;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Per-user SSE hub for ticket lifecycle events (currently: transfers). Unlike the entrance-stats
 * stream — which is one broadcast for everyone — ticket events are private, so emitters are keyed
 * by userId and a transfer event is delivered only to the two accounts involved: the sender
 * (so their other open tabs/devices drop the card too) and the receiver (so the ticket pops into
 * their My Account instantly).
 */
@Service
@Lazy(false) // the app runs with global lazy-init; the Kafka consumer must start even before any subscriber exists
public class TicketEventsBroadcaster {

    private static final long EMITTER_TIMEOUT_MS = 30 * 60 * 1000L;

    private final ConcurrentMap<Long, List<SseEmitter>> emittersByUser = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public SseEmitter subscribe(Long userId) {
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        List<SseEmitter> userEmitters = emittersByUser.computeIfAbsent(userId, id -> new CopyOnWriteArrayList<>());
        emitter.onCompletion(() -> userEmitters.remove(emitter));
        emitter.onTimeout(() -> userEmitters.remove(emitter));
        emitter.onError(e -> userEmitters.remove(emitter));
        userEmitters.add(emitter);
        return emitter;
    }

    @KafkaListener(topics = KafkaConfig.TICKET_EVENTS_TOPIC, groupId = "${spring.kafka.consumer.group-id}")
    public void onTicketEvent(String eventJson) {
        try {
            JsonNode event = objectMapper.readTree(eventJson);
            sendToUser(event.path("fromUserId").asLong(-1), eventJson);
            sendToUser(event.path("toUserId").asLong(-1), eventJson);
        } catch (IOException e) {
            org.slf4j.LoggerFactory.getLogger(TicketEventsBroadcaster.class)
                    .warn("Eveniment de bilet invalid primit din Kafka: {}", eventJson, e);
        }
    }

    private void sendToUser(long userId, String eventJson) {
        List<SseEmitter> userEmitters = emittersByUser.get(userId);
        if (userEmitters == null) {
            return;
        }
        for (SseEmitter emitter : userEmitters) {
            try {
                emitter.send(SseEmitter.event().name("ticket-event").data(eventJson));
            } catch (IOException e) {
                userEmitters.remove(emitter); // client went away; drop it
            }
        }
    }
}
