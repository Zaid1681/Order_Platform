package com.example.orders_api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;

public record CreateOrderRequest(
        @NotBlank String orderNumber,
        @NotBlank @Email String customerEmail,
        @NotNull @DecimalMin(value = "0.00", inclusive = false) BigDecimal totalAmount,
        @NotBlank @Pattern(regexp = "pending|processing|shipped|delivered|cancelled")
        String status
) {
}
