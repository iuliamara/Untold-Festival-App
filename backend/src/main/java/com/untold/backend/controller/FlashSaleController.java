package com.untold.backend.controller;

import com.untold.backend.dto.TicketDto;
import com.untold.backend.dto.PersonDto;
import com.untold.backend.dto.BraceletDto;
import com.untold.backend.model.Ticket;
import com.untold.backend.service.FlashSaleService;
import com.untold.backend.service.FlashSaleService.FlashSaleStatus;
import com.untold.backend.dto.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/flash-sale")
public class FlashSaleController {

    private final FlashSaleService flashSaleService;

    public FlashSaleController(FlashSaleService flashSaleService) {
        this.flashSaleService = flashSaleService;
    }

    /**
     * GET /api/flash-sale/status?userId=
     * Returns current flash sale state for a given user.
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<FlashSaleStatus>> getStatus(
            @RequestParam(required = false) Long userId) {
        FlashSaleStatus status = flashSaleService.getStatus(userId != null ? userId : -1L);
        return ResponseEntity.ok(ApiResponse.success("Flash sale status retrieved", status));
    }

    /**
     * POST /api/flash-sale/join
     * Body: { "userId": 123 }
     * Adds the user to the queue.
     */
    @PostMapping("/join")
    public ResponseEntity<ApiResponse<Map<String, Object>>> joinQueue(@RequestBody Map<String, Long> body) {
        try {
            Long userId = body.get("userId");
            if (userId == null) return ResponseEntity.badRequest().body(ApiResponse.error("userId is required"));
            int position = flashSaleService.joinQueue(userId);
            return ResponseEntity.ok(ApiResponse.success("Joined queue", Map.of("queuePosition", position)));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * POST /api/flash-sale/leave
     * Body: { "userId": 123 }
     * Removes the user from the queue.
     */
    @PostMapping("/leave")
    public ResponseEntity<ApiResponse<String>> leaveQueue(@RequestBody Map<String, Long> body) {
        try {
            Long userId = body.get("userId");
            if (userId == null) return ResponseEntity.badRequest().body(ApiResponse.error("userId is required"));
            boolean removed = flashSaleService.leaveQueue(userId);
            if (removed) {
                return ResponseEntity.ok(ApiResponse.success("Left queue successfully", "removed"));
            } else {
                return ResponseEntity.ok(ApiResponse.success("User was not in queue", "not_found"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * POST /api/flash-sale/purchase
     * Body: { "userId": 123 }
     * Purchases the flash sale ticket directly (no cart).
     */
    @PostMapping("/purchase")
    public ResponseEntity<ApiResponse<com.untold.backend.dto.response.CheckoutResponse>> purchaseFlashTicket(
            @RequestBody Map<String, Long> body,
            @RequestHeader(value = "Origin", required = false) String origin) {
        try {
            Long userId = body.get("userId");
            if (userId == null) return ResponseEntity.badRequest().body(ApiResponse.error("userId is required"));
            String checkoutUrl = flashSaleService.purchaseFlashTicket(userId, origin);
            return ResponseEntity.ok(ApiResponse.success("Flash sale checkout session created", com.untold.backend.dto.response.CheckoutResponse.builder().url(checkoutUrl).build()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    // -------- Mapper --------

    private TicketDto toDto(Ticket ticket) {
        PersonDto personDto = null;
        if (ticket.getAttendee() != null) {
            personDto = new PersonDto();
            personDto.setId(ticket.getAttendee().getId());
            personDto.setFirstName(ticket.getAttendee().getFirstName());
            personDto.setLastName(ticket.getAttendee().getLastName());
        }

        BraceletDto braceletDto = null;
        if (ticket.getBracelet() != null) {
            braceletDto = new BraceletDto(
                ticket.getBracelet().getId(),
                ticket.getBracelet().getRfidTag(),
                ticket.getBracelet().getBalance()
            );
        }

        return TicketDto.builder()
                .id(ticket.getId())
                .ticketType(ticket.getTicketType())
                .displayName(ticket.getTicketType() != null ? com.untold.backend.model.TicketType.valueOf(ticket.getTicketType()).getDisplayName() : null)
                .price(ticket.getPrice())
                .purchaseDate(ticket.getPurchaseDate())
                .checkInCompleted(ticket.isCheckInCompleted())
                .attendee(personDto)
                .bracelet(braceletDto)
                .build();
    }
}
