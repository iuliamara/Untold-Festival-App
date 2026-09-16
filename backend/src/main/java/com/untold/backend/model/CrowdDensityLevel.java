package com.untold.backend.model;

public enum CrowdDensityLevel {
    LOW(1),
    MODERATE(2),
    HIGH(3),
    CRITICAL(4);

    private final int score;

    CrowdDensityLevel(int score) {
        this.score = score;
    }

    public int getScore() {
        return score;
    }

    public static CrowdDensityLevel fromScore(double score) {
        long rounded = Math.round(score);
        for (CrowdDensityLevel level : values()) {
            if (level.score == rounded) {
                return level;
            }
        }
        return rounded <= LOW.score ? LOW : CRITICAL;
    }
}
