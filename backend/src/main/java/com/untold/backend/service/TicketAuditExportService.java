package com.untold.backend.service;

import com.untold.backend.dto.CategoryStatsDto;
import com.untold.backend.dto.TicketStatsDto;
import com.untold.backend.model.TicketCategory;
import com.untold.backend.repository.TicketRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
public class TicketAuditExportService {

    @Autowired
    private TicketService ticketService;

    @Autowired
    private TicketRepository ticketRepository;

    public byte[] generateExcelAuditReport() throws IOException {
        TicketStatsDto stats = ticketService.getTicketStats();
        List<Object[]> dailySales = ticketRepository.getDailySalesVelocity();
        List<Object[]> countryStats = ticketRepository.getCountryDemographics();
        long checkedInCount = ticketRepository.countByCheckInCompleted(true);
        long totalCount = ticketRepository.count();
        Double avgAge = ticketRepository.getAverageAttendeeAge();

        // 1. Initialize Streaming Workbook (keeping 100 rows in memory window)
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100); 
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            // ==========================================
            // REUSABLE CELL STYLES & FONTS (WORKBOOK LEVEL)
            // ==========================================
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleFont.setColor(IndexedColors.INDIGO.getIndex());

            CellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFont(titleFont);

            Font sectionFont = workbook.createFont();
            sectionFont.setBold(true);
            sectionFont.setFontHeightInPoints((short) 12);
            sectionFont.setColor(IndexedColors.DARK_BLUE.getIndex());

            CellStyle sectionStyle = workbook.createCellStyle();
            sectionStyle.setFont(sectionFont);

            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerFont.setFontHeightInPoints((short) 11);

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.INDIGO.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.LEFT);
            headerStyle.setBorderBottom(BorderStyle.MEDIUM);

            CellStyle rightHeaderStyle = workbook.createCellStyle();
            rightHeaderStyle.cloneStyleFrom(headerStyle);
            rightHeaderStyle.setAlignment(HorizontalAlignment.RIGHT);

            CellStyle currencyStyle = workbook.createCellStyle();
            DataFormat format = workbook.createDataFormat();
            currencyStyle.setDataFormat(format.getFormat("#,##0.00\" RON\""));

            CellStyle percentStyle = workbook.createCellStyle();
            percentStyle.setDataFormat(format.getFormat("0.0%"));

            CellStyle intStyle = workbook.createCellStyle();
            intStyle.setDataFormat(format.getFormat("#,##0"));

            Font boldFont = workbook.createFont();
            boldFont.setBold(true);

            CellStyle totalRowStyle = workbook.createCellStyle();
            totalRowStyle.setFont(boldFont);
            totalRowStyle.setBorderTop(BorderStyle.DOUBLE);
            totalRowStyle.setBorderBottom(BorderStyle.THIN);

            CellStyle totalCurrencyStyle = workbook.createCellStyle();
            totalCurrencyStyle.cloneStyleFrom(currencyStyle);
            totalCurrencyStyle.setFont(boldFont);
            totalCurrencyStyle.setBorderTop(BorderStyle.DOUBLE);
            totalCurrencyStyle.setBorderBottom(BorderStyle.THIN);

            CellStyle totalPercentStyle = workbook.createCellStyle();
            totalPercentStyle.cloneStyleFrom(percentStyle);
            totalPercentStyle.setFont(boldFont);
            totalPercentStyle.setBorderTop(BorderStyle.DOUBLE);
            totalPercentStyle.setBorderBottom(BorderStyle.THIN);

            CellStyle kpiLabelStyle = workbook.createCellStyle();
            kpiLabelStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            kpiLabelStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            kpiLabelStyle.setBorderBottom(BorderStyle.THIN);
            kpiLabelStyle.setBorderTop(BorderStyle.THIN);
            kpiLabelStyle.setBorderLeft(BorderStyle.THIN);
            kpiLabelStyle.setBorderRight(BorderStyle.THIN);

            CellStyle kpiValueStyle = workbook.createCellStyle();
            kpiValueStyle.setFont(boldFont);
            kpiValueStyle.cloneStyleFrom(kpiLabelStyle);

            CellStyle kpiCurrencyStyle = workbook.createCellStyle();
            kpiCurrencyStyle.cloneStyleFrom(kpiValueStyle);
            kpiCurrencyStyle.setDataFormat(format.getFormat("#,##0.00\" RON\""));

            CellStyle kpiPercentStyle = workbook.createCellStyle();
            kpiPercentStyle.cloneStyleFrom(kpiValueStyle);
            kpiPercentStyle.setDataFormat(format.getFormat("0.0%"));

            // ==========================================
            // SHEET 1: EXECUTIVE SUMMARY
            // ==========================================
            Sheet sheet1 = workbook.createSheet("Executive Summary");
            
            Row s1Title = sheet1.createRow(0);
            Cell s1TitleCell = s1Title.createCell(0);
            s1TitleCell.setCellValue("UNTOLD FESTIVAL 2026");
            s1TitleCell.setCellStyle(titleStyle);

            Row s1Sub = sheet1.createRow(1);
            s1Sub.createCell(0).setCellValue("Official Executive Audit Dashboard");

            Row s1Meta = sheet1.createRow(2);
            s1Meta.createCell(0).setCellValue("Generated: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

            // KPI Card Block (Row 5 - Row 8)
            Row kpiHeader = sheet1.createRow(4);
            Cell kh1 = kpiHeader.createCell(1); kh1.setCellValue("Global Sales Indicator"); kh1.setCellStyle(headerStyle);
            Cell kh2 = kpiHeader.createCell(2); kh2.setCellValue("Calculated Value (Active Formula)"); kh2.setCellStyle(rightHeaderStyle);

            Row kpi1 = sheet1.createRow(5);
            Cell kpi1L = kpi1.createCell(1); kpi1L.setCellValue("Total Gross Revenue"); kpi1L.setCellStyle(kpiLabelStyle);
            Cell kpi1V = kpi1.createCell(2); kpi1V.setCellFormula("SUM('Sales Allocation'!F5:F7)"); kpi1V.setCellStyle(kpiCurrencyStyle);

            Row kpi2 = sheet1.createRow(6);
            Cell kpi2L = kpi2.createCell(1); kpi2L.setCellValue("Total Tickets Sold"); kpi2L.setCellStyle(kpiLabelStyle);
            Cell kpi2V = kpi2.createCell(2); kpi2V.setCellFormula("SUM('Sales Allocation'!B5:B7)"); kpi2V.setCellStyle(kpiValueStyle);

            Row kpi3 = sheet1.createRow(7);
            Cell kpi3L = kpi3.createCell(1); kpi3L.setCellValue("Global Capacity Utilization"); kpi3L.setCellStyle(kpiLabelStyle);
            Cell kpi3V = kpi3.createCell(2); kpi3V.setCellFormula("C7/SUM('Sales Allocation'!C5:C7)"); kpi3V.setCellStyle(kpiPercentStyle);

            sheet1.setColumnWidth(0, 4500);
            sheet1.setColumnWidth(1, 8000);
            sheet1.setColumnWidth(2, 8500);

            // ==========================================
            // SHEET 2: SALES ALLOCATION
            // ==========================================
            Sheet sheet2 = workbook.createSheet("Sales Allocation");
            
            Row s2Title = sheet2.createRow(0);
            Cell s2TitleCell = s2Title.createCell(0);
            s2TitleCell.setCellValue("TICKET CATEGORY ALLOCATION MATRIX");
            s2TitleCell.setCellStyle(titleStyle);

            Row s2Meta = sheet2.createRow(1);
            s2Meta.createCell(0).setCellValue("Live database category sales ledger");

            String[] columns2 = {"Ticket Category", "Tickets Sold", "Total Capacity", "Allocation Progress", "Average Ticket Price", "Estimated Revenue"};
            Row s2Header = sheet2.createRow(3);
            for (int col = 0; col < columns2.length; col++) {
                Cell cell = s2Header.createCell(col);
                cell.setCellValue(columns2[col]);
                cell.setCellStyle(headerStyle);
            }

            int s2CurrentRow = 4;
            boolean hasStats = stats != null && stats.getCategoryStats() != null && !stats.getCategoryStats().isEmpty();

            if (!hasStats) {
                Row emptyRow = sheet2.createRow(s2CurrentRow);
                emptyRow.createCell(0).setCellValue("No category statistics found in database.");
                s2CurrentRow++;
            } else {
                for (Map.Entry<TicketCategory, CategoryStatsDto> entry : stats.getCategoryStats().entrySet()) {
                    Row row = sheet2.createRow(s2CurrentRow);

                    row.createCell(0).setCellValue(entry.getKey().name() + " Ticket Pass");
                    
                    Cell sCell = row.createCell(1);
                    sCell.setCellValue(entry.getValue().getSold());
                    sCell.setCellStyle(intStyle);

                    Cell cCell = row.createCell(2);
                    cCell.setCellValue(entry.getValue().getCapacity());
                    cCell.setCellStyle(intStyle);

                    Cell pCell = row.createCell(3);
                    int excelRow = s2CurrentRow + 1;
                    pCell.setCellFormula("B" + excelRow + "/C" + excelRow);
                    pCell.setCellStyle(percentStyle);

                    Cell prCell = row.createCell(4);
                    prCell.setCellValue(entry.getValue().getAvgPrice());
                    prCell.setCellStyle(currencyStyle);

                    Cell rCell = row.createCell(5);
                    rCell.setCellFormula("B" + excelRow + "*E" + excelRow);
                    rCell.setCellStyle(currencyStyle);

                    s2CurrentRow++;
                }

                // Total Summary Row
                Row totalRow = sheet2.createRow(s2CurrentRow);
                totalRow.createCell(0).setCellValue("Total Summary");
                totalRow.getCell(0).setCellStyle(totalRowStyle);

                int firstData = 5; // row index 5 (which is excel row 5)
                int lastData = s2CurrentRow; // row index s2CurrentRow (which is excel row s2CurrentRow)

                Cell totSold = totalRow.createCell(1);
                totSold.setCellFormula("SUM(B" + firstData + ":B" + lastData + ")");
                totSold.setCellStyle(totalRowStyle);

                Cell totCap = totalRow.createCell(2);
                totCap.setCellFormula("SUM(C" + firstData + ":C" + lastData + ")");
                totCap.setCellStyle(totalRowStyle);

                Cell totProgress = totalRow.createCell(3);
                int excelTotal = s2CurrentRow + 1;
                totProgress.setCellFormula("B" + excelTotal + "/C" + excelTotal);
                totProgress.setCellStyle(totalPercentStyle);

                Cell totAvgPlace = totalRow.createCell(4);
                totAvgPlace.setCellValue("-");
                totAvgPlace.setCellStyle(totalRowStyle);

                Cell totRev = totalRow.createCell(5);
                totRev.setCellFormula("SUM(F" + firstData + ":F" + lastData + ")");
                totRev.setCellStyle(totalCurrencyStyle);
            }

            sheet2.setColumnWidth(0, 8000);
            sheet2.setColumnWidth(1, 4500);
            sheet2.setColumnWidth(2, 4500);
            sheet2.setColumnWidth(3, 5500);
            sheet2.setColumnWidth(4, 6000);
            sheet2.setColumnWidth(5, 6000);

            // ==========================================
            // SHEET 3: DAILY SALES VELOCITY
            // ==========================================
            Sheet sheet3 = workbook.createSheet("Daily Sales Velocity");
            
            Row s3Title = sheet3.createRow(0);
            Cell s3TitleCell = s3Title.createCell(0);
            s3TitleCell.setCellValue("CHRONOLOGICAL TRANSACTION VELOCITY");
            s3TitleCell.setCellStyle(titleStyle);

            Row s3Meta = sheet3.createRow(1);
            s3Meta.createCell(0).setCellValue("Daily checkouts and cumulative billing trends");

            String[] columns3 = {"Purchase Date", "Daily Sales Count", "Daily Revenue Generated", "Cumulative Volume"};
            Row s3Header = sheet3.createRow(3);
            for (int col = 0; col < columns3.length; col++) {
                Cell cell = s3Header.createCell(col);
                cell.setCellValue(columns3[col]);
                cell.setCellStyle(headerStyle);
            }

            int s3CurrentRow = 4;
            if (dailySales == null || dailySales.isEmpty()) {
                Row emptyRow = sheet3.createRow(s3CurrentRow);
                emptyRow.createCell(0).setCellValue("No sales checkouts recorded.");
                s3CurrentRow++;
            } else {
                for (Object[] record : dailySales) {
                    Row row = sheet3.createRow(s3CurrentRow);
                    
                    row.createCell(0).setCellValue(record[0] != null ? record[0].toString() : "Unknown");
                    
                    Cell scCell = row.createCell(1);
                    scCell.setCellValue(((Number) record[1]).longValue());
                    scCell.setCellStyle(intStyle);

                    Cell revCell = row.createCell(2);
                    revCell.setCellValue(((Number) record[2]).doubleValue());
                    revCell.setCellStyle(currencyStyle);

                    // Cumulative Sales Formula: =SUM(B$5:B[Row])
                    Cell cumCell = row.createCell(3);
                    int excelRow = s3CurrentRow + 1;
                    cumCell.setCellFormula("SUM(B$5:B" + excelRow + ")");
                    cumCell.setCellStyle(intStyle);

                    s3CurrentRow++;
                }

                // Summary Row for Sales Count and Revenue
                Row s3TotalRow = sheet3.createRow(s3CurrentRow);
                s3TotalRow.createCell(0).setCellValue("Total Summary");
                s3TotalRow.getCell(0).setCellStyle(totalRowStyle);

                Cell s3TotCount = s3TotalRow.createCell(1);
                s3TotCount.setCellFormula("SUM(B5:B" + s3CurrentRow + ")");
                s3TotCount.setCellStyle(totalRowStyle);

                Cell s3TotRev = s3TotalRow.createCell(2);
                s3TotRev.setCellFormula("SUM(C5:C" + s3CurrentRow + ")");
                s3TotRev.setCellStyle(totalCurrencyStyle);

                Cell s3CumPlace = s3TotalRow.createCell(3);
                s3CumPlace.setCellValue("-");
                s3CumPlace.setCellStyle(totalRowStyle);
            }

            sheet3.setColumnWidth(0, 6000);
            sheet3.setColumnWidth(1, 5500);
            sheet3.setColumnWidth(2, 6500);
            sheet3.setColumnWidth(3, 5500);

            // ==========================================
            // SHEET 4: ATTENDEE PROFILE & SCANNING
            // ==========================================
            Sheet sheet4 = workbook.createSheet("Attendee & Scanning Audit");
            
            Row s4Title = sheet4.createRow(0);
            Cell s4TitleCell = s4Title.createCell(0);
            s4TitleCell.setCellValue("ATTENDEE PROFILE & GATE SCANNING UTILITY");
            s4TitleCell.setCellStyle(titleStyle);

            Row s4Meta = sheet4.createRow(1);
            s4Meta.createCell(0).setCellValue("Geographical analysis and real-time gate entry logs");

            // Section A: Nationalities (Row 4)
            Row s4SecA = sheet4.createRow(3);
            Cell sacCell = s4SecA.createCell(0);
            sacCell.setCellValue("Geographic Buyer Demographics");
            sacCell.setCellStyle(sectionStyle);

            String[] columns4A = {"Attendee Country", "Tickets Purchased", "Geographic Ratio"};
            Row s4HeaderA = sheet4.createRow(4);
            for (int col = 0; col < columns4A.length; col++) {
                Cell cell = s4HeaderA.createCell(col);
                cell.setCellValue(columns4A[col]);
                cell.setCellStyle(headerStyle);
            }

            int s4CurrentRow = 5;
            if (countryStats == null || countryStats.isEmpty()) {
                Row emptyRow = sheet4.createRow(s4CurrentRow);
                emptyRow.createCell(0).setCellValue("No attendee records captured.");
                s4CurrentRow++;
            } else {
                int firstCountryRow = 6;
                for (Object[] record : countryStats) {
                    Row row = sheet4.createRow(s4CurrentRow);
                    
                    row.createCell(0).setCellValue(record[0] != null ? record[0].toString() : "Unknown");
                    
                    Cell countCell = row.createCell(1);
                    countCell.setCellValue(((Number) record[1]).longValue());
                    countCell.setCellStyle(intStyle);

                    // Dynamic Ratio: =B[Row]/SUM(B$6:B$[LastCountryRow])
                    Cell ratioCell = row.createCell(2);
                    int excelRow = s4CurrentRow + 1;
                    int lastCountryExcelRow = 5 + countryStats.size();
                    ratioCell.setCellFormula("B" + excelRow + "/SUM(B$" + firstCountryRow + ":B$" + lastCountryExcelRow + ")");
                    ratioCell.setCellStyle(percentStyle);

                    s4CurrentRow++;
                }

                // Nationalities summary row
                Row natTotalRow = sheet4.createRow(s4CurrentRow);
                natTotalRow.createCell(0).setCellValue("Total Demographics");
                natTotalRow.getCell(0).setCellStyle(totalRowStyle);

                Cell natCountSum = natTotalRow.createCell(1);
                natCountSum.setCellFormula("SUM(B" + firstCountryRow + ":B" + s4CurrentRow + ")");
                natCountSum.setCellStyle(totalRowStyle);

                Cell natRatioSum = natTotalRow.createCell(2);
                natRatioSum.setCellFormula("C" + firstCountryRow + "/B" + (s4CurrentRow + 1)); // should evaluate to 100%
                natRatioSum.setCellFormula("SUM(C" + firstCountryRow + ":C" + s4CurrentRow + ")");
                natRatioSum.setCellStyle(totalPercentStyle);

                s4CurrentRow += 2; // Add spacing
            }

            // Section B: Scanning Status (Row s4CurrentRow)
            Row s4SecB = sheet4.createRow(s4CurrentRow);
            Cell sbcCell = s4SecB.createCell(0);
            sbcCell.setCellValue("Gate Entry & Demographic Summary");
            sbcCell.setCellStyle(sectionStyle);
            s4CurrentRow++;

            String[] columns4B = {"Check-In Indicator metric", "Value"};
            Row s4HeaderB = sheet4.createRow(s4CurrentRow);
            for (int col = 0; col < columns4B.length; col++) {
                Cell cell = s4HeaderB.createCell(col);
                cell.setCellValue(columns4B[col]);
                cell.setCellStyle(headerStyle);
            }
            s4CurrentRow++;

            // Dynamic Check-In totals
            Row checkInRow1 = sheet4.createRow(s4CurrentRow);
            checkInRow1.createCell(0).setCellValue("Total Scanned Check-Ins (Completed)");
            Cell cInV = checkInRow1.createCell(1);
            cInV.setCellValue(checkedInCount);
            cInV.setCellStyle(intStyle);
            s4CurrentRow++;

            Row checkInRow2 = sheet4.createRow(s4CurrentRow);
            checkInRow2.createCell(0).setCellValue("Global Registered Attendees (Sold)");
            Cell cTotV = checkInRow2.createCell(1);
            cTotV.setCellValue(totalCount);
            cTotV.setCellStyle(intStyle);
            s4CurrentRow++;

            Row checkInRow3 = sheet4.createRow(s4CurrentRow);
            checkInRow3.createCell(0).setCellValue("Gate Scanned check-in utility");
            Cell cPctV = checkInRow3.createCell(1);
            // Formula: Checked-in / Total
            int rScanned = s4CurrentRow - 1; // row index of checkInRow1 + 1 (excel row)
            int rTotal = s4CurrentRow;      // row index of checkInRow2 + 1 (excel row)
            cPctV.setCellFormula("B" + rScanned + "/B" + rTotal);
            cPctV.setCellStyle(percentStyle);
            s4CurrentRow++;

            Row ageRow = sheet4.createRow(s4CurrentRow);
            ageRow.createCell(0).setCellValue("Average Registered Attendee Age (Years)");
            Cell ageV = ageRow.createCell(1);
            ageV.setCellValue(avgAge != null ? avgAge : 0.0);
            ageV.setCellStyle(intStyle);
            s4CurrentRow++;

            sheet4.setColumnWidth(0, 9500);
            sheet4.setColumnWidth(1, 5000);
            sheet4.setColumnWidth(2, 5000);

            // ==========================================
            // FINALIZE WORKBOOK WRITING
            // ==========================================
            workbook.write(out);
            workbook.dispose(); // clean up POI temporary XML files on disk
            return out.toByteArray();
        }
    }
}
