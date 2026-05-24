package com.isik.campusos.auth.service;

import com.isik.campusos.auth.dto.CertificateIssueRequestedEvent;
import com.isik.campusos.auth.model.User;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class CertificatePdfService {

    private static final DateTimeFormatter INPUT_DATE = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final DateTimeFormatter DISPLAY_DATE = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    private static final PDFont TITLE_FONT = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
    private static final PDFont BOLD_FONT = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
    private static final PDFont REGULAR_FONT = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

    public byte[] generateCertificate(User user, CertificateIssueRequestedEvent event) {
        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            PDRectangle pageSize = new PDRectangle(PDRectangle.A4.getHeight(), PDRectangle.A4.getWidth());
            PDPage page = new PDPage(pageSize);
            document.addPage(page);

            try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                drawCertificate(document, content, pageSize, user, event);
            }

            document.save(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Sertifika PDF'i olusturulamadi: " + e.getClass().getSimpleName() + " - " + e.getMessage(), e);
        }
    }

    private void drawCertificate(PDDocument document,
                                 PDPageContentStream content,
                                 PDRectangle pageSize,
                                 User user,
                                 CertificateIssueRequestedEvent event) throws Exception {
        float width = pageSize.getWidth();
        float height = pageSize.getHeight();
        float margin = 56;

        content.setNonStrokingColor(new Color(247, 245, 255));
        content.addRect(0, 0, width, height);
        content.fill();

        content.setNonStrokingColor(Color.WHITE);
        content.addRect(margin, margin, width - margin * 2, height - margin * 2);
        content.fill();

        content.setStrokingColor(new Color(109, 93, 252));
        content.setLineWidth(3);
        content.addRect(margin + 12, margin + 12, width - (margin + 12) * 2, height - (margin + 12) * 2);
        content.stroke();

        float centerX = width / 2;
        writeCentered(content, BOLD_FONT, 13, "ISIK Campus OS", centerX, height - 126, 109, 93, 252);
        writeCentered(content, TITLE_FONT, 38, "Katilim Sertifikasi", centerX, height - 176, 22, 22, 42);
        writeCentered(content, REGULAR_FONT, 16, "Bu belge, asagidaki ogrencinin etkinlige katilimini dogrular.", centerX, height - 214, 86, 86, 111);
        writeCentered(content, BOLD_FONT, 31, pdfText(user.getFullName()), centerX, height - 282, 17, 17, 35);
        writeCentered(content, BOLD_FONT, 21, pdfText(title(event)), centerX, height - 340, 36, 36, 71);
        writeCentered(content, REGULAR_FONT, 15, pdfText(event.getClubName()), centerX, height - 370, 86, 86, 111);
        drawUniversityLogo(document, content, centerX, height - 470);

        write(content, REGULAR_FONT, 12, "Duzenlenme: " + pdfText(formatIssuedAt(event.getIssuedAt())), margin + 42, margin + 46, 86, 86, 111);
        writeRight(content, BOLD_FONT, 12, "Sertifika Kodu: " + pdfText(event.getCertificateCode()), width - margin - 42, margin + 46, 17, 17, 35);
    }

    private void drawUniversityLogo(PDDocument document,
                                    PDPageContentStream content,
                                    float centerX,
                                    float y) throws Exception {
        File logo = Path.of("frontend", "public", "isik-logo.png").toFile();
        if (!logo.exists()) {
            return;
        }

        PDImageXObject image = PDImageXObject.createFromFileByContent(logo, document);
        float targetWidth = 150;
        float ratio = targetWidth / image.getWidth();
        float targetHeight = image.getHeight() * ratio;
        content.drawImage(image, centerX - targetWidth / 2, y, targetWidth, targetHeight);
    }

    private void writeCentered(PDPageContentStream content,
                               PDFont font,
                               float size,
                               String text,
                               float centerX,
                               float y,
                               int r,
                               int g,
                               int b) throws Exception {
        String safeText = fit(text, 82);
        float textWidth = font.getStringWidth(safeText) / 1000 * size;
        write(content, font, size, safeText, centerX - textWidth / 2, y, r, g, b);
    }

    private void writeRight(PDPageContentStream content,
                            PDFont font,
                            float size,
                            String text,
                            float rightX,
                            float y,
                            int r,
                            int g,
                            int b) throws Exception {
        String safeText = fit(text, 70);
        float textWidth = font.getStringWidth(safeText) / 1000 * size;
        write(content, font, size, safeText, rightX - textWidth, y, r, g, b);
    }

    private void write(PDPageContentStream content,
                       PDFont font,
                       float size,
                       String text,
                       float x,
                       float y,
                       int r,
                       int g,
                       int b) throws Exception {
        content.beginText();
        content.setFont(font, size);
        content.setNonStrokingColor(new Color(r, g, b));
        content.newLineAtOffset(x, y);
        content.showText(pdfText(text));
        content.endText();
    }

    private String title(CertificateIssueRequestedEvent event) {
        if (event.getCertificateTitle() != null && !event.getCertificateTitle().isBlank()) {
            return event.getCertificateTitle().trim();
        }
        return event.getEventTitle();
    }

    private String formatIssuedAt(String value) {
        if (value == null || value.isBlank()) {
            return LocalDateTime.now().format(DISPLAY_DATE);
        }
        try {
            return LocalDateTime.parse(value, INPUT_DATE).format(DISPLAY_DATE);
        } catch (Exception ignored) {
            return value;
        }
    }

    private String fit(String value, int maxLength) {
        String text = pdfText(value);
        if (text.length() <= maxLength) {
            return text;
        }
        return text.substring(0, Math.max(0, maxLength - 3)) + "...";
    }

    private String pdfText(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("ı", "i")
                .replace("İ", "I")
                .replace("ğ", "g")
                .replace("Ğ", "G")
                .replace("ü", "u")
                .replace("Ü", "U")
                .replace("ş", "s")
                .replace("Ş", "S")
                .replace("ö", "o")
                .replace("Ö", "O")
                .replace("ç", "c")
                .replace("Ç", "C")
                .replaceAll("[^\\x20-\\x7E]", "");
    }
}
