package com.untold.backend.controller;

import com.untold.backend.service.TicketAuditExportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/audit")
public class TicketAuditController {

    @Autowired
    private TicketAuditExportService exportService;

    @GetMapping("/export-tickets")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportTicketAuditReport() {
        try {
            byte[] fileContent = exportService.generateExcelAuditReport();
            
            String dateStr = LocalDate.now().toString();
            String fileName = "audit-bilete-" + dateStr + ".xlsx";
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, HttpHeaders.CONTENT_DISPOSITION)
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(fileContent);
                    
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
