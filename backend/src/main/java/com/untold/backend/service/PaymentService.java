package com.untold.backend.service;
import com.untold.backend.model.*;
import com.untold.backend.repository.*;
import com.untold.backend.service.*;
import org.springframework.context.annotation.Lazy;import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import com.untold.backend.model.TicketType;
import com.untold.backend.service.TicketService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class PaymentService {

    private final TicketService ticketService;
    private final FlashSaleService flashSaleService;

    @Value("${stripe.secret-key}")
    private String stripeSecretKey;

    @Value("${stripe.webhook-secret}")
    private String stripeWebhookSecret;

    public PaymentService(TicketService ticketService, @Lazy FlashSaleService flashSaleService) {
        this.ticketService = ticketService;
        this.flashSaleService = flashSaleService;
    }

    public String createCheckoutSession(Long userId, List<Map<String, Object>> tickets, String currency, String origin) throws StripeException {
        Stripe.apiKey = stripeSecretKey;

        String stripeCurrency = (currency != null) ? currency.toLowerCase() : "ron";
        String finalOrigin = (origin != null && !origin.isEmpty()) ? origin : "http://localhost:5173";

        SessionCreateParams.Builder builder = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(finalOrigin + "/payment/success?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(finalOrigin + "/payment/cancel")
                // Store cart data in metadata so we can retrieve it after payment
                .putMetadata("orderType", "TICKET_PURCHASE")
                .putMetadata("userId", String.valueOf(userId))
                .putMetadata("ticketCount", String.valueOf(tickets.size()));

        // Add each ticket as a line item
        for (int i = 0; i < tickets.size(); i++) {
            Map<String, Object> ticket = tickets.get(i);
            String ticketType = (String) ticket.get("ticketType");
            double priceInRON = ((Number) ticket.get("price")).doubleValue();
            // Store base price in RON in metadata so the DB remains consistent!
            builder.putMetadata("ticket_" + i, ticketType + "|" + priceInRON);

            // Convert amount to target currency for Stripe charge
            double convertedPrice = CurrencyConverter.convertRONTo(priceInRON, stripeCurrency);
            long unitAmount = Math.round(convertedPrice * 100);

            builder.addLineItem(
                SessionCreateParams.LineItem.builder()
                    .setQuantity(1L)
                    .setPriceData(
                        SessionCreateParams.LineItem.PriceData.builder()
                            .setCurrency(stripeCurrency)
                            .setUnitAmount(unitAmount)
                            .setProductData(
                                SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                    .setName(formatTicketName(ticketType))
                                    .setDescription("UNTOLD Festival 2025 Ticket")
                                    .build()
                            )
                            .build()
                    )
                    .build()
            );
        }

        Session session = Session.create(builder.build());
        return session.getUrl();
    }

    public String createTopUpCheckoutSession(Long ticketId, Double amount, String currency, String origin) throws StripeException {
        Stripe.apiKey = stripeSecretKey;

        String stripeCurrency = (currency != null) ? currency.toLowerCase() : "ron";
        String finalOrigin = (origin != null && !origin.isEmpty()) ? origin : "http://localhost:5173";

        SessionCreateParams.Builder builder = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(finalOrigin + "/payment/success?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(finalOrigin + "/payment/cancel")
                .putMetadata("orderType", "TOP_UP")
                .putMetadata("ticketId", String.valueOf(ticketId))
                .putMetadata("amount", String.valueOf(amount))
                .putMetadata("currency", stripeCurrency);

        long unitAmount = Math.round(amount * 100);

        builder.addLineItem(
            SessionCreateParams.LineItem.builder()
                .setQuantity(1L)
                .setPriceData(
                    SessionCreateParams.LineItem.PriceData.builder()
                        .setCurrency(stripeCurrency)
                        .setUnitAmount(unitAmount)
                        .setProductData(
                            SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                .setName("Untold Wristband Top-Up")
                                .setDescription("Cashless Top-Up")
                                .build()
                        )
                        .build()
                )
                .build()
        );

        Session session = Session.create(builder.build());
        return session.getUrl();
    }

    /**
     * Retrieves the Stripe Checkout Session and, if payment was successful,
     * calls buyTicketsBulk to create the tickets in the database.
     */
    public List<?> fulfillOrder(String sessionId) throws StripeException {
        Stripe.apiKey = stripeSecretKey;

        Session session = Session.retrieve(sessionId);

        if (!"complete".equals(session.getStatus()) && !"paid".equals(session.getPaymentStatus())) {
            throw new RuntimeException("Payment not completed for session: " + sessionId);
        }

        String orderType = session.getMetadata().get("orderType");

        if ("TOP_UP".equals(orderType)) {
            Long ticketId = Long.parseLong(session.getMetadata().get("ticketId"));
            Double amount = Double.parseDouble(session.getMetadata().get("amount"));
            String paymentCurrency = session.getMetadata().get("currency");
            if (paymentCurrency == null) {
                paymentCurrency = "ron";
            }
            // Convert paid amount in target currency back to base RON
            Double amountInRON = CurrencyConverter.convertToBaseRON(amount, paymentCurrency);
            Ticket updatedTicket = ticketService.topUpBracelet(ticketId, amountInRON);
            return List.of(updatedTicket);
        }

        // TICKET_PURCHASE or legacy
        Long userId = Long.parseLong(session.getMetadata().get("userId"));
        int ticketCount = Integer.parseInt(session.getMetadata().get("ticketCount"));

        boolean isFlashSalePurchase = false;
        List<Map<String, Object>> tickets = new java.util.ArrayList<>();
        for (int i = 0; i < ticketCount; i++) {
            String ticketData = session.getMetadata().get("ticket_" + i);
            String[] parts = ticketData.split("\\|");
            String ticketType = parts[0];
            double price = Double.parseDouble(parts[1]);
            tickets.add(Map.of("ticketType", ticketType, "price", price));
            
            if (TicketType.GA_4_DAYS_FLASH_SALE.name().equals(ticketType)) {
                isFlashSalePurchase = true;
            }
        }

        List<?> purchasedTickets = ticketService.buyTicketsBulk(userId, tickets);

        if (isFlashSalePurchase) {
            flashSaleService.handleSuccessfulPurchase(userId);
            flashSaleService.broadcastStatus();
        }

        return purchasedTickets;
    }

    /**
     * Validates a Stripe webhook signature and processes the event.
     * Used for production-grade event handling.
     */
    public Event constructEvent(String payload, String sigHeader) throws SignatureVerificationException {
        return Webhook.constructEvent(payload, sigHeader, stripeWebhookSecret);
    }

    private String formatTicketName(String ticketType) {
        // Convert enum name to a readable format, e.g. GA_4_DAYS_PHASE_5 -> GA 4 Days Phase 5
        try {
            return TicketType.valueOf(ticketType).getDisplayName();
        } catch (IllegalArgumentException e) {
            return ticketType.replace("_", " ");
        }
    }
}
