package com.untold.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QrCodeResponse {
    /** Full string to encode in the QR image: UNTOLD-DYN|<rfidTag>|<window>|<hmac>. */
    private String qrPayload;
    /** Seconds until the current 30s window rolls over and the payload stops being valid. */
    private int expiresInSeconds;
    /** Total window length, so the client can render a proportional countdown. */
    private int windowSeconds;
}
