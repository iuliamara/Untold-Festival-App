package com.untold.backend.service;

import com.untold.backend.configs.KafkaConfig;
import org.springframework.context.annotation.Lazy;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Bridges Kafka to the UIs: browsers and the Android admin app can't consume Kafka directly, so
 * this service holds every open Server-Sent-Events connection and re-emits each Kafka entrance
 * event to all of them. Publishing to Kafka (instead of pushing straight to emitters from
 * TicketService) decouples the scan write-path from delivery, and would let any number of backend
 * instances or other consumers react to the same event stream.
 */
@Service
@Lazy(false) // the app runs with global lazy-init; an SSE bridge nobody has referenced yet must still consume
public class EntranceStatsBroadcaster {

    private static final long EMITTER_TIMEOUT_MS = 30 * 60 * 1000L;

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter subscribe(String initialEventJson) {
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(e -> emitters.remove(emitter));
        emitters.add(emitter);
        try {
            // Push the current count immediately so a freshly-opened screen isn't blank until
            // the next scan happens.
            emitter.send(SseEmitter.event().name("entrance-stats").data(initialEventJson));
        } catch (IOException e) {
            emitters.remove(emitter);
        }
        return emitter;
    }

    @KafkaListener(topics = KafkaConfig.ENTRANCE_EVENTS_TOPIC, groupId = "${spring.kafka.consumer.group-id}")
    public void onEntranceEvent(String eventJson) {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("entrance-stats").data(eventJson));
            } catch (IOException e) {
                emitters.remove(emitter); // client went away; drop it
            }
        }
    }
}
