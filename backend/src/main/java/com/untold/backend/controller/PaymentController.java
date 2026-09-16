package com.untold.backend.controller;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.untold.backend.dto.PersonDto;
import com.untold.backend.dto.request.CheckoutSessionRequest;
import com.untold.backend.dto.request.ConfirmPaymentRequest;
import com.untold.backend.dto.request.TicketItemRequest;
import com.untold.backend.dto.request.TopUpSessionRequest;
import com.untold.backend.dto.response.ApiResponse;
import com.untold.backend.dto.response.CheckoutResponse;
import com.untold.backend.dto.TicketDto;
import com.untold.backend.dto.BraceletDto;
import com.untold.backend.model.Ticket;
import com.untold.backend.model.TicketTier;
import com.untold.backend.model.TicketType;
import com.untold.backend.service.FlashSaleService;
import com.untold.backend.service.PaymentService;
import com.untold.backend.service.TicketService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    private final PaymentService paymentService;
    private final TicketService ticketService;
    private final FlashSaleService flashSaleService;

    public PaymentController(PaymentService paymentService, TicketService ticketService, FlashSaleService flashSaleService) {
        this.paymentService = paymentService;
        this.ticketService = ticketService;
        this.flashSaleService = flashSaleService;
    }

    @PostMapping("/create-checkout-session")
    public ResponseEntity<ApiResponse<CheckoutResponse>> createCheckoutSession(
            @RequestBody CheckoutSessionRequest request,
            @RequestHeader(value = "Origin", required = false) String origin) {
        try {
            List<Map<String, Object>> ticketMaps = request.getTickets().stream()
                    .map(this::ticketItemToMap)
                    .collect(Collectors.toList());

            String checkoutUrl = paymentService.createCheckoutSession(request.getUserId(), ticketMaps, request.getCurrency(), origin);

            return ResponseEntity.ok(ApiResponse.success(
                "Checkout session created",
                CheckoutResponse.builder().url(checkoutUrl).build()
            ));
        } catch (StripeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/create-topup-session")
    public ResponseEntity<ApiResponse<CheckoutResponse>> createTopUpSession(
            @RequestBody TopUpSessionRequest request,
            @RequestHeader(value = "Origin", required = false) String origin) {
        try {
            String checkoutUrl = paymentService.createTopUpCheckoutSession(request.getTicketId(), request.getAmount(), request.getCurrency(), origin);
            return ResponseEntity.ok(ApiResponse.success(
                "Top-up session created",
                CheckoutResponse.builder().url(checkoutUrl).build()
            ));
        } catch (StripeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Called by the frontend on the success page to confirm the order.
     * Retrieves the session from Stripe, verifies payment, and creates the tickets.
     */
    /**
     * Called by the frontend on the success page to confirm the order.
     * Retrieves the session from Stripe, verifies payment, and creates the tickets.
     */
    @PostMapping("/confirm")
    public ResponseEntity<ApiResponse<List<TicketDto>>> confirmPayment(@RequestBody ConfirmPaymentRequest request) {
        try {
            List<?> tickets = paymentService.fulfillOrder(request.getSessionId());

            // Process flash sale queue cleanup BEFORE converting to DTOs,
            // so we still have access to the Ticket entity (and its Order/User).
            processPotentialFlashSalePurchase(tickets);

            List<TicketDto> responses = tickets.stream()
                    .filter(t -> t instanceof Ticket)
                    .map(t -> toTicketDto((Ticket) t))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(ApiResponse.success("Payment confirmed and tickets issued", responses));
        } catch (StripeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Stripe webhook endpoint (for production use with signed events).
     */
    /**
     * Stripe webhook endpoint (for production use with signed events).
     * Also handles flash sale queue cleanup when payment is confirmed server-side.
     */
    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {
        try {
            Event event = paymentService.constructEvent(payload, sigHeader);

            if ("checkout.session.completed".equals(event.getType())) {
                Session session = (Session) event.getDataObjectDeserializer()
                        .getObject()
                        .orElseThrow();
                List<?> tickets = paymentService.fulfillOrder(session.getId());
                // Also clean up flash sale queue if applicable
                processPotentialFlashSalePurchase(tickets);
            }

            return ResponseEntity.ok("Received");
        } catch (SignatureVerificationException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid signature");
        } catch (StripeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    /**
     * Checks if any of the purchased tickets is a flash-sale ticket and, if so,
     * removes the buyer from the queue and broadcasts the new remaining count
     * to all connected WebSocket clients.
     *
     * NOTE: Must be called with the raw List<?> returned by fulfillOrder, NOT
     * with the TicketDto list, because we need access to the Ticket entity
     * to traverse Ticket -> AppOrder -> User.
     */
    private void processPotentialFlashSalePurchase(List<?> tickets) {
        boolean hasFlashSale = tickets.stream()
                .filter(t -> t instanceof Ticket)
                .map(t -> (Ticket) t)
                .anyMatch(t -> "GA_4_DAYS_FLASH_SALE".equals(t.getTicketType()));

        if (hasFlashSale) {
            Long userId = tickets.stream()
                    .filter(t -> t instanceof Ticket)
                    .map(t -> (Ticket) t)
                    // getUser() throws when there is no AppOrder; navigate via getOrder() instead
                    .filter(t -> t.getOrder() != null && t.getOrder().getUser() != null)
                    .map(t -> t.getOrder().getUser().getId())
                    .findFirst()
                    .orElse(null);

            if (userId != null) {
                System.out.println("[PaymentController] Flash sale confirmed for userId=" + userId + " – cleaning queue and broadcasting.");
                flashSaleService.handleSuccessfulPurchase(userId);
            } else {
                System.err.println("[PaymentController] Flash sale ticket found but could not resolve userId – skipping queue cleanup.");
            }
        }
    }

    private Map<String, Object> ticketItemToMap(TicketItemRequest item) {
        Map<String, Object> map = new HashMap<>();
        map.put("ticketType", item.getTicketType());
        map.put("price", item.getPrice());
        return map;
    }

    private TicketDto toTicketDto(Ticket ticket) {
        String rfidTag = ticket.getBracelet() != null ? ticket.getBracelet().getRfidTag() : null;
        
        String displayName = null;
        if (ticket.getTicketType() != null) {
            TicketTier tier = ticketService.getTierById(ticket.getTicketType());
            if (tier != null) {
                displayName = tier.getDisplayName();
            } else {
                try {
                    TicketType enumType = TicketType.valueOf(ticket.getTicketType());
                    displayName = enumType.getDisplayName();
                } catch (IllegalArgumentException e) {
                    displayName = ticket.getTicketType().replace("_", " ");
                }
            }
        }

        PersonDto personDto = null;
        if (ticket.getAttendee() != null) {
            personDto = new PersonDto();
            personDto.setId(ticket.getAttendee().getId());
            personDto.setFirstName(ticket.getAttendee().getFirstName());
            personDto.setLastName(ticket.getAttendee().getLastName());
            personDto.setDateOfBirth(ticket.getAttendee().getDateOfBirth());
            personDto.setGender(ticket.getAttendee().getGender());
            personDto.setCountry(ticket.getAttendee().getCountry());
            personDto.setCity(ticket.getAttendee().getCity());
            personDto.setDocumentType(ticket.getAttendee().getDocumentType());
            personDto.setDocumentId(ticket.getAttendee().getDocumentId());
            personDto.setPhoneNumber(ticket.getAttendee().getPhoneNumber());
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
                .displayName(displayName)
                .price(ticket.getPrice())
                .purchaseDate(ticket.getPurchaseDate())
                .checkInCompleted(ticket.isCheckInCompleted())
                .rfidTag(rfidTag)
                .attendee(personDto)
                .bracelet(braceletDto)
                .build();
    }
}
