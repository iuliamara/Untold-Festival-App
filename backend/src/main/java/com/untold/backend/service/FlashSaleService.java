package com.untold.backend.service;

import com.untold.backend.model.TicketTier;
import com.untold.backend.model.TicketType;
import com.untold.backend.repository.TicketTierRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentLinkedQueue;

@Service
public class FlashSaleService {

    @Value("${flash.sale.open.datetime}")
    private String flashSaleOpenDatetime;

    @Value("${flash.sale.total.tickets}")
    private int totalTickets;

    private final TicketTierRepository ticketTierRepository;
    private final TicketService ticketService;
    private final PaymentService paymentService;
    private final SimpMessagingTemplate messagingTemplate;

    private final ConcurrentLinkedQueue<Long> waitQueue = new ConcurrentLinkedQueue<>();
    private final Set<Long> inQueueSet = Collections.synchronizedSet(new LinkedHashSet<>());
    private LocalDateTime saleOpenTime;

    private static final double DISCOUNT_FACTOR = 0.50;

    public FlashSaleService(TicketTierRepository ticketTierRepository,
                            TicketService ticketService,
                            PaymentService paymentService,
                            SimpMessagingTemplate messagingTemplate) {
        this.ticketTierRepository = ticketTierRepository;
        this.ticketService = ticketService;
        this.paymentService = paymentService;
        this.messagingTemplate = messagingTemplate;
    }

    @PostConstruct
    public void init() {
        saleOpenTime = LocalDateTime.parse(flashSaleOpenDatetime, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
    }

    public int getTicketsRemaining() {
        return ticketTierRepository.findById(TicketType.GA_4_DAYS_FLASH_SALE.name())
            .map(tier -> tier.getQuantity() != null ? tier.getQuantity() : 0)
            .orElse(0);
    }

    public FlashSaleStatus getStatus(Long userId) {
        boolean open = isFlashSaleOpen();
        int remaining = getTicketsRemaining();
        int queuePosition = getQueuePosition(userId);
        boolean userInQueue = inQueueSet.contains(userId);
        int queueSize = waitQueue.size();

        return new FlashSaleStatus(
            open,
            remaining,
            totalTickets,
            queuePosition,
            queueSize,
            userInQueue,
            saleOpenTime.toString(),
            flashSaleOpenDatetime
        );
    }

    public boolean isFlashSaleOpen() {
        return LocalDateTime.now(ZoneId.of("Europe/Bucharest")).compareTo(saleOpenTime) >= 0;
    }

    public synchronized int joinQueue(Long userId) {
        if (!isFlashSaleOpen()) {
            throw new IllegalStateException("Flash sale has not opened yet.");
        }
        if (getTicketsRemaining() <= 0) {
            throw new IllegalStateException("Flash sale is sold out.");
        }
        if (inQueueSet.contains(userId)) {
            return getQueuePosition(userId);
        }
        waitQueue.offer(userId);
        inQueueSet.add(userId);
        broadcastStatus();
        return getQueuePosition(userId);
    }

    public synchronized boolean leaveQueue(Long userId) {
        boolean removed = inQueueSet.remove(userId);
        if (removed) {
            waitQueue.remove(userId);
            broadcastStatus();
        }
        return removed;
    }

    @Transactional
    public synchronized String purchaseFlashTicket(Long userId, String origin) throws com.stripe.exception.StripeException {
        if (!isFlashSaleOpen()) {
            throw new IllegalStateException("Flash sale has not opened yet.");
        }

        int position = getQueuePosition(userId);
        if (position <= 0) {
            throw new IllegalStateException("You are not in the flash sale queue.");
        }
        if (position > getTicketsRemaining()) {
            throw new IllegalStateException("You are beyond the available ticket range. Wait for a cancellation.");
        }
        if (getTicketsRemaining() <= 0) {
            throw new IllegalStateException("All flash sale tickets have been sold.");
        }

        // We DO NOT leave queue or decrement here anymore. It's done on payment confirmation!
        double originalPrice = TicketType.GA_4_DAYS_FLASH_SALE.getDefaultPrice(); // Using flash sale base price

        List<Map<String, Object>> tickets = List.of(Map.of("ticketType", TicketType.GA_4_DAYS_FLASH_SALE.name(), "price", originalPrice));
        return paymentService.createCheckoutSession(userId, tickets, "ron", origin);
    }

    public synchronized void handleSuccessfulPurchase(Long userId) {
        // Stripe payment was confirmed!
        // Remove from queue
        inQueueSet.remove(userId);
        waitQueue.remove(userId);

        // Notify all connected flash-sale WebSocket clients with the new ticket count
        broadcastTicketsRemaining();
    }

    public int getQueuePosition(Long userId) {
        if (!inQueueSet.contains(userId)) return 0;
        int pos = 1;
        for (Long id : waitQueue) {
            if (id.equals(userId)) return pos;
            pos++;
        }
        return 0;
    }

    public boolean isUserInQueue(Long userId) {
        return inQueueSet.contains(userId);
    }

    /**
     * Pushes the current tickets-remaining count and queue to every connected STOMP client.
     */
    public void broadcastStatus() {
        int remaining = getTicketsRemaining();
        int queueSize = waitQueue.size();
        List<Long> queueList = new ArrayList<>(waitQueue);
        
        System.out.println("[FlashSale] Broadcasting STOMP status: ticketsRemaining=" + remaining + ", queueSize=" + queueSize + ", queueList=" + queueList);
        
        Map<String, Object> payload = new HashMap<>();
        payload.put("ticketsRemaining", remaining);
        payload.put("queueSize", queueSize);
        payload.put("queue", queueList);
        
        messagingTemplate.convertAndSend("/topic/flash-sale", payload);
    }

    // Keep existing method for backward compatibility
    public void broadcastTicketsRemaining() {
        broadcastStatus();
    }

    public record FlashSaleStatus(
        boolean isOpen,
        int ticketsRemaining,
        int totalTickets,
        int queuePosition,
        int queueSize,
        boolean inQueue,
        String openTimeStr,
        String originalDatetime
    ) {}
}
