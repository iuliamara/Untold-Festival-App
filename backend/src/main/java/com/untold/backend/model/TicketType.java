package com.untold.backend.model;

public enum TicketType {
    GA_4_DAYS_PHASE_5("GA - Acces 4 Zile - Phase 5", 1155.31, TicketCategory.GA, null),
    GA_4_DAYS_UNDER_25_PHASE_2("GA - Acces 4 Zile - Under 25 - Phase 2", 792.01, TicketCategory.GA, null),
    GA_4_DAYS_FLASH_SALE("GA - Acces 4 Zile - Flash Sale", 577.65, TicketCategory.GA, null),
    
    VIP_MAINSTAGE_4_DAYS_PHASE_3("VIP Mainstage - Acces 4 Zile - Phase 3", 2380.83, TicketCategory.VIP, null),
    GALAXY_BACKSTAGE_4_DAYS("Galaxy Backstage - Acces 4 Zile", 1928.95, TicketCategory.BACKSTAGE, null),
    VIP_ULTIMATE_EXPERIENCE("VIP ULTIMATE EXPERIENCE", 14532.16, TicketCategory.VIP, null),
    
    GA_4_DAYS_FRIENDSHIP_PACK_2("GA - Acces 4 Zile - Friendship Pack (Pachet 2 Bilete)", 937.33, TicketCategory.GA, null),
    GA_4_DAYS_FRIENDSHIP_PACK_3("GA - Acces 4 Zile - Friendship Pack (Pachet 3 Bilete)", 864.66, TicketCategory.GA, null),
    GA_4_DAYS_FRIENDSHIP_PACK_4("GA - Acces 4 Zile - Friendship Pack (Pachet 4 Bilete)", 719.34, TicketCategory.GA, null),
    
    GA_DAY_1_PHASE_2("GA - Ziua 1 - Joi - Phase 2", 544.96, TicketCategory.GA, 1),
    GA_DAY_2_PHASE_2("GA - Ziua 2 - Vineri - Phase 2", 544.96, TicketCategory.GA, 2),
    GA_DAY_3_PHASE_2("GA - Ziua 3 - Sâmbătă - Phase 2", 544.96, TicketCategory.GA, 3),
    GA_DAY_4_PHASE_2("GA - Ziua 4 - Duminică - Phase 2", 544.96, TicketCategory.GA, 4),
    
    VIP_MAINSTAGE_DAY_1_PHASE_2("VIP Mainstage - Ziua 1 - Joi - Phase 2", 835.82, TicketCategory.VIP, 1),
    VIP_MAINSTAGE_DAY_2_PHASE_2("VIP Mainstage - Ziua 2 - Vineri - Phase 2", 835.82, TicketCategory.VIP, 2),
    VIP_MAINSTAGE_DAY_3_PHASE_2("VIP Mainstage - Ziua 3 - Sâmbătă - Phase 2", 835.82, TicketCategory.VIP, 3),
    VIP_MAINSTAGE_DAY_4_PHASE_2("VIP Mainstage - Ziua 4 - Duminică - Phase 2", 835.82, TicketCategory.VIP, 4);

    private final String displayName;
    private final Double defaultPrice;
    private final TicketCategory category;
    // Which festival day (1-4) this ticket grants entry on; null means valid all 4 days.
    private final Integer festivalDay;

    TicketType(String displayName, Double defaultPrice, TicketCategory category, Integer festivalDay) {
        this.displayName = displayName;
        this.defaultPrice = defaultPrice;
        this.category = category;
        this.festivalDay = festivalDay;
    }

    public String getDisplayName() {
        return displayName;
    }

    public Double getDefaultPrice() {
        return defaultPrice;
    }

    public TicketCategory getCategory() {
        return category;
    }

    public Integer getFestivalDay() {
        return festivalDay;
    }
}
