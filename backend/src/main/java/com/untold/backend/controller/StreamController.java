package com.untold.backend.controller;

import com.untold.backend.model.User;
import com.untold.backend.repository.UserRepository;
import com.untold.backend.security.JwtTokenProvider;
import com.untold.backend.service.EntranceStatsBroadcaster;
import com.untold.backend.service.TicketEventsBroadcaster;
import com.untold.backend.service.TicketService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * Server-Sent-Events endpoints. Deliberately under /api/stream (not /api/tickets) so long-lived
 * subscription connections don't consume tokens from the ticket endpoints' rate-limit bucket.
 */
@RestController
@RequestMapping("/api/stream")
public class StreamController {

    private final EntranceStatsBroadcaster entranceBroadcaster;
    private final TicketEventsBroadcaster ticketBroadcaster;
    private final TicketService ticketService;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;

    public StreamController(EntranceStatsBroadcaster entranceBroadcaster,
                            TicketEventsBroadcaster ticketBroadcaster,
                            TicketService ticketService,
                            JwtTokenProvider tokenProvider,
                            UserRepository userRepository) {
        this.entranceBroadcaster = entranceBroadcaster;
        this.ticketBroadcaster = ticketBroadcaster;
        this.ticketService = ticketService;
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
    }

    @GetMapping(value = "/entrance-stats", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamEntranceStats() {
        long current = ticketService.getTodayEntranceCount();
        return entranceBroadcaster.subscribe("{\"entriesInside\":" + current + "}");
    }

    /**
     * Private, per-user stream of ticket events (transfers). The JWT comes as a query parameter
     * because the browser's native EventSource API cannot set an Authorization header; the token
     * is validated here with the same provider the auth filter uses.
     */
    @GetMapping(value = "/tickets", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamTicketEvents(@RequestParam("token") String token) {
        if (token == null || !tokenProvider.validateToken(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token invalid sau expirat.");
        }
        User user = userRepository.findByEmail(tokenProvider.getEmailFromJWT(token))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utilizator inexistent."));
        return ticketBroadcaster.subscribe(user.getId());
    }
}
