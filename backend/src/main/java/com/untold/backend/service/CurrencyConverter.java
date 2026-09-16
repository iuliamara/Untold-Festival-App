package com.untold.backend.service;

public class CurrencyConverter {
    public static final double EUR_RATE = 0.2014; // 1 RON = 0.2014 EUR
    public static final double USD_RATE = 0.2185; // 1 RON = 0.2185 USD

    public static double convertRONTo(double amountInRON, String targetCurrency) {
        if (targetCurrency == null) return amountInRON;
        switch (targetCurrency.toUpperCase()) {
            case "EUR":
                return amountInRON * EUR_RATE;
            case "USD":
                return amountInRON * USD_RATE;
            case "RON":
            default:
                return amountInRON;
        }
    }

    public static double convertToBaseRON(double amount, String sourceCurrency) {
        if (sourceCurrency == null) return amount;
        switch (sourceCurrency.toUpperCase()) {
            case "EUR":
                return amount / EUR_RATE;
            case "USD":
                return amount / USD_RATE;
            case "RON":
            default:
                return amount;
        }
    }
}
