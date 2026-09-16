package com.untold.backend.service;

import com.untold.backend.dto.AppOrderDto;
import com.untold.backend.dto.TicketDto;
import com.untold.backend.dto.UserDataExportDto;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.graphics.state.PDExtendedGraphicsState;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Renders the GDPR data export as a PDF styled after the attendee app's dark,
 * neon-glass theme (see frontend-attendee MyAccount.tsx) instead of a plain
 * document, since this export is festival branding, not just a data dump.
 */
@Service
public class PdfExportService {

    private static final float PAGE_WIDTH = PDRectangle.A4.getWidth();
    private static final float PAGE_HEIGHT = PDRectangle.A4.getHeight();
    private static final float MARGIN = 48;
    private static final float CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;
    private static final float FOOTER_HEIGHT = 34;
    private static final float BANNER_HEIGHT = 92;
    private static final float CARD_RADIUS = 8;

    // Untold Festival dark theme palette (matches frontend-attendee's #0d0d1e / neon accents)
    private static final Color PAGE_BG = new Color(13, 13, 30);
    private static final Color BANNER_BG = new Color(24, 14, 51);
    private static final Color COLOR_CYAN = new Color(0, 219, 233);
    private static final Color COLOR_GLOW = new Color(209, 188, 255);
    private static final Color COLOR_PRIMARY = new Color(139, 92, 255);
    private static final Color COLOR_CORAL = new Color(255, 111, 97);
    private static final Color COLOR_WHITE = Color.WHITE;
    private static final Color COLOR_MUTED = new Color(176, 168, 197);
    private static final Color COLOR_MUTED_DIM = new Color(120, 113, 140);

    public byte[] generateUserDataExportPdf(UserDataExportDto export) throws IOException {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Cursor cursor = new Cursor(document);
            cursor.drawBanner(export.getExportedAt());

            cursor.sectionTitle("Date de cont");
            if (export.getAccount() != null) {
                cursor.field("Nume utilizator", export.getAccount().getUsername());
                cursor.field("Email", export.getAccount().getEmail());
                cursor.field("Tip cont", String.valueOf(export.getAccount().getUserType()));
            }
            cursor.gap(14);

            cursor.sectionTitle("Comenzi (" + safeSize(export.getOrders()) + ")");
            if (export.getOrders() != null && !export.getOrders().isEmpty()) {
                for (AppOrderDto order : export.getOrders()) {
                    List<String[]> fields = new ArrayList<>();
                    fields.add(new String[]{"Tip", String.valueOf(order.getOrderType())});
                    fields.add(new String[]{"Suma platita", order.getAmountPaid() + " RON"});
                    fields.add(new String[]{"Data achizitiei", String.valueOf(order.getPurchaseDate())});
                    cursor.card("Comanda #" + order.getId(), fields, COLOR_PRIMARY);
                }
            } else {
                cursor.emptyNote("Nicio comanda inregistrata.");
            }
            cursor.gap(14);

            cursor.sectionTitle("Bilete (" + safeSize(export.getTickets()) + ")");
            if (export.getTickets() != null && !export.getTickets().isEmpty()) {
                for (TicketDto ticket : export.getTickets()) {
                    List<String[]> fields = new ArrayList<>();
                    fields.add(new String[]{"Pret", ticket.getPrice() + " RON"});
                    fields.add(new String[]{"Data achizitiei", String.valueOf(ticket.getPurchaseDate())});
                    fields.add(new String[]{"Check-in efectuat", ticket.isCheckInCompleted() ? "Da" : "Nu"});
                    if (ticket.getAttendee() != null) {
                        fields.add(new String[]{"Participant", ticket.getAttendee().getFirstName() + " " + ticket.getAttendee().getLastName()});
                        fields.add(new String[]{"Data nasterii", String.valueOf(ticket.getAttendee().getDateOfBirth())});
                        fields.add(new String[]{"Gen", ticket.getAttendee().getGender()});
                        fields.add(new String[]{"Tara / Oras", ticket.getAttendee().getCountry() + " / " + ticket.getAttendee().getCity()});
                        fields.add(new String[]{"Document", ticket.getAttendee().getDocumentType() + " - " + ticket.getAttendee().getDocumentId()});
                        fields.add(new String[]{"Telefon", ticket.getAttendee().getPhoneNumber()});
                    }
                    if (ticket.getBracelet() != null) {
                        fields.add(new String[]{"Bratara RFID", ticket.getBracelet().getRfidTag()});
                        fields.add(new String[]{"Sold bratara", ticket.getBracelet().getBalance() + " RON"});
                    }
                    cursor.card("Bilet #" + ticket.getId() + " - " + ticket.getDisplayName(), fields, COLOR_CYAN);
                }
            } else {
                cursor.emptyNote("Niciun bilet inregistrat.");
            }

            cursor.finish();
            document.save(out);
            return out.toByteArray();
        }
    }

    private int safeSize(List<?> list) {
        return list == null ? 0 : list.size();
    }

    private static final String DIACRITICS_FROM = "ăâîșşțţĂÂÎȘŞȚŢ";
    private static final String DIACRITICS_TO = "aaissttAAISSTT";

    private static String sanitize(String text) {
        if (text == null) return "";
        // The standard Helvetica font (WinAnsiEncoding) can't render Romanian-specific
        // diacritics (ă, î, ș, ț); transliterate them, then drop anything else non-ASCII
        // so PDFBox never throws on an unsupported glyph.
        StringBuilder result = new StringBuilder(text.length());
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            int idx = DIACRITICS_FROM.indexOf(c);
            if (idx >= 0) {
                result.append(DIACRITICS_TO.charAt(idx));
            } else if (c >= 0x20 && c < 0x7F) {
                result.append(c);
            } else {
                result.append('?');
            }
        }
        return result.toString();
    }

    /** Owns pagination: dark background, banner, section titles, field rows, glass-style cards, footer. */
    private static class Cursor {
        private final PDDocument document;
        private PDPage page;
        private PDPageContentStream stream;
        private float y;
        private int pageNumber;

        Cursor(PDDocument document) throws IOException {
            this.document = document;
            startNewPage();
        }

        private void startNewPage() throws IOException {
            if (stream != null) {
                drawFooter();
                stream.close();
            }
            page = new PDPage(PDRectangle.A4);
            document.addPage(page);
            stream = new PDPageContentStream(document, page);
            pageNumber++;
            y = PAGE_HEIGHT - MARGIN;

            stream.setNonStrokingColor(PAGE_BG);
            stream.addRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
            stream.fill();

            if (pageNumber > 1) {
                stream.setNonStrokingColor(COLOR_CYAN);
                stream.addRect(0, PAGE_HEIGHT - 4, PAGE_WIDTH, 4);
                stream.fill();
                drawText(MARGIN, y, "UNTOLD FESTIVAL - EXPORT DATE PERSONALE (CONTINUARE)", PDType1Font.HELVETICA_BOLD, 9, COLOR_MUTED);
                y -= 26;
            }
        }

        void ensure(float neededHeight) throws IOException {
            if (y - neededHeight < MARGIN + FOOTER_HEIGHT) {
                startNewPage();
            }
        }

        void drawBanner(String exportedAt) throws IOException {
            stream.setNonStrokingColor(BANNER_BG);
            stream.addRect(0, PAGE_HEIGHT - BANNER_HEIGHT, PAGE_WIDTH, BANNER_HEIGHT);
            stream.fill();

            stream.setNonStrokingColor(COLOR_CYAN);
            stream.addRect(0, PAGE_HEIGHT - BANNER_HEIGHT, PAGE_WIDTH, 3);
            stream.fill();

            drawText(MARGIN, PAGE_HEIGHT - 42, "UNTOLD FESTIVAL", PDType1Font.HELVETICA_BOLD, 23, COLOR_WHITE);
            drawText(MARGIN, PAGE_HEIGHT - 62, "EXPORT DATE PERSONALE - DREPTUL DE ACCES GDPR", PDType1Font.HELVETICA_BOLD, 9.5f, COLOR_CYAN);

            String generatedLine = "Generat la: " + sanitize(exportedAt);
            float w = PDType1Font.HELVETICA.getStringWidth(generatedLine) / 1000 * 9;
            drawText(PAGE_WIDTH - MARGIN - w, PAGE_HEIGHT - 42, generatedLine, PDType1Font.HELVETICA, 9, COLOR_MUTED);

            y = PAGE_HEIGHT - BANNER_HEIGHT - 30;
        }

        void sectionTitle(String title) throws IOException {
            ensure(32);
            drawText(MARGIN, y, sanitize(title).toUpperCase(), PDType1Font.HELVETICA_BOLD, 13, COLOR_GLOW);
            y -= 6;
            setAlpha(0.4f);
            stream.setStrokingColor(COLOR_CYAN);
            stream.setLineWidth(1.1f);
            stream.moveTo(MARGIN, y);
            stream.lineTo(MARGIN + CONTENT_WIDTH, y);
            stream.stroke();
            setAlpha(1f);
            y -= 16;
        }

        void field(String label, String value) throws IOException {
            ensure(16);
            String labelText = sanitize(label) + ":";
            drawText(MARGIN, y, labelText, PDType1Font.HELVETICA_BOLD, 9.5f, COLOR_MUTED);
            float labelWidth = PDType1Font.HELVETICA_BOLD.getStringWidth(labelText) / 1000 * 9.5f;
            drawText(MARGIN + labelWidth + 6, y, sanitize(value == null ? "-" : value), PDType1Font.HELVETICA, 10.5f, COLOR_WHITE);
            y -= 16;
        }

        void emptyNote(String text) throws IOException {
            ensure(18);
            drawText(MARGIN, y, sanitize(text), PDType1Font.HELVETICA_OBLIQUE, 10, COLOR_MUTED);
            y -= 18;
        }

        void card(String title, List<String[]> fields, Color accent) throws IOException {
            float padding = 12;
            float lineHeight = 14;
            float titleHeight = 16;
            float cardHeight = padding * 2 + titleHeight + fields.size() * lineHeight;

            ensure(cardHeight + 14);

            float cardTop = y;
            float cardBottom = y - cardHeight;

            // "glass panel" fill: a faint white overlay on the dark background, like bg-white/5 in the app
            stream.setNonStrokingColor(COLOR_WHITE);
            setAlpha(0.05f);
            roundedRectPath(MARGIN, cardBottom, CONTENT_WIDTH, cardHeight, CARD_RADIUS);
            stream.fill();
            setAlpha(1f);

            // subtle border, like border-white/10
            stream.setStrokingColor(COLOR_WHITE);
            setAlpha(0.14f);
            stream.setLineWidth(0.8f);
            roundedRectPath(MARGIN, cardBottom, CONTENT_WIDTH, cardHeight, CARD_RADIUS);
            stream.stroke();
            setAlpha(1f);

            // accent bar, inset so it doesn't poke past the rounded corners
            stream.setNonStrokingColor(accent);
            stream.addRect(MARGIN + 5, cardBottom + CARD_RADIUS * 0.7f, 3, cardHeight - CARD_RADIUS * 1.4f);
            stream.fill();

            float textX = MARGIN + padding + 8;
            float cursorY = cardTop - padding - 11;
            drawText(textX, cursorY, sanitize(title), PDType1Font.HELVETICA_BOLD, 11, COLOR_WHITE);
            cursorY -= lineHeight;

            for (String[] f : fields) {
                String labelText = sanitize(f[0]) + ":";
                drawText(textX, cursorY, labelText, PDType1Font.HELVETICA_BOLD, 9, COLOR_MUTED);
                float labelWidth = PDType1Font.HELVETICA_BOLD.getStringWidth(labelText) / 1000 * 9;
                drawText(textX + labelWidth + 6, cursorY, sanitize(f[1] == null ? "-" : f[1]), PDType1Font.HELVETICA, 9.5f, COLOR_WHITE);
                cursorY -= lineHeight;
            }

            y = cardBottom - 12;
        }

        void gap(float amount) {
            y -= amount;
        }

        /** Builds a rounded-rectangle path (does not fill/stroke) — caller decides. */
        private void roundedRectPath(float x, float yPos, float width, float height, float radius) throws IOException {
            stream.moveTo(x + radius, yPos);
            stream.lineTo(x + width - radius, yPos);
            stream.curveTo(x + width, yPos, x + width, yPos, x + width, yPos + radius);
            stream.lineTo(x + width, yPos + height - radius);
            stream.curveTo(x + width, yPos + height, x + width, yPos + height, x + width - radius, yPos + height);
            stream.lineTo(x + radius, yPos + height);
            stream.curveTo(x, yPos + height, x, yPos + height, x, yPos + height - radius);
            stream.lineTo(x, yPos + radius);
            stream.curveTo(x, yPos, x, yPos, x + radius, yPos);
            stream.closePath();
        }

        /** Sets both fill and stroke alpha; MUST be reset to 1f right after a translucent draw finishes,
         *  since PDF alpha state is a graphics-state side effect that otherwise leaks into later text draws. */
        private void setAlpha(float alpha) throws IOException {
            PDExtendedGraphicsState gs = new PDExtendedGraphicsState();
            gs.setNonStrokingAlphaConstant(alpha);
            gs.setStrokingAlphaConstant(alpha);
            stream.setGraphicsStateParameters(gs);
        }

        private void drawText(float x, float yPos, String text, PDType1Font font, float size, Color color) throws IOException {
            stream.beginText();
            stream.setFont(font, size);
            stream.setNonStrokingColor(color);
            stream.newLineAtOffset(x, yPos);
            stream.showText(sanitize(text));
            stream.endText();
        }

        private void drawFooter() throws IOException {
            setAlpha(0.15f);
            stream.setStrokingColor(COLOR_WHITE);
            stream.setLineWidth(0.8f);
            stream.moveTo(MARGIN, MARGIN - 8);
            stream.lineTo(MARGIN + CONTENT_WIDTH, MARGIN - 8);
            stream.stroke();
            setAlpha(1f);

            String footerText = "UNTOLD FESTIVAL 2026  -  Document generat automat  -  Pagina " + pageNumber;
            float w = PDType1Font.HELVETICA.getStringWidth(footerText) / 1000 * 8;
            drawText(PAGE_WIDTH / 2 - w / 2, MARGIN - 22, footerText, PDType1Font.HELVETICA, 8, COLOR_MUTED_DIM);
        }

        void finish() throws IOException {
            drawFooter();
            stream.close();
        }
    }
}
