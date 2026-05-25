package com.isik.campusos.auth.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.isik.campusos.auth.dto.CertificateIssueRequestedEvent;
import com.isik.campusos.auth.model.User;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.LosslessFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class CertificatePdfService {

    private static final DateTimeFormatter INPUT_DATE = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final DateTimeFormatter DISPLAY_DATE = DateTimeFormatter.ofPattern("dd MMMM yyyy");
    private static final DateTimeFormatter ISSUED_DATE = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");
    private static final String VERIFY_PAGE_BASE_URL = "http://localhost:8080/certificates/verify";

    public byte[] generateCertificate(User user, CertificateIssueRequestedEvent event) {
        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            PDRectangle pageSize = new PDRectangle(PDRectangle.A4.getHeight(), PDRectangle.A4.getWidth());
            PDPage page = new PDPage(pageSize);
            document.addPage(page);
            CertificateFonts fonts = loadFonts(document);

            try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                drawCertificate(document, content, pageSize, fonts, user, event);
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
                                 CertificateFonts fonts,
                                 User user,
                                 CertificateIssueRequestedEvent event) throws Exception {
        float width = pageSize.getWidth();
        float height = pageSize.getHeight();
        float margin = 42;
        float centerX = width / 2;

        fill(content, 0, 0, width, height, new Color(244, 247, 251));
        fill(content, margin, margin, width - margin * 2, height - margin * 2, Color.WHITE);

        content.setStrokingColor(new Color(24, 41, 84));
        content.setLineWidth(2.2f);
        content.addRect(margin + 12, margin + 12, width - (margin + 12) * 2, height - (margin + 12) * 2);
        content.stroke();

        content.setStrokingColor(new Color(180, 146, 67));
        content.setLineWidth(1.1f);
        content.addRect(margin + 24, margin + 24, width - (margin + 24) * 2, height - (margin + 24) * 2);
        content.stroke();

        drawUniversityLogo(document, content, margin + 54, height - 118, 96);

        writeCentered(content, fonts.bold(), fonts.unicode(), 19, "FMV IŞIK ÜNİVERSİTESİ", centerX, height - 94, new Color(24, 41, 84));
        writeCentered(content, fonts.regular(), fonts.unicode(), 12, valueOr(event.getClubName(), "Etkinliği Düzenleyen Kulüp"), centerX, height - 116, new Color(86, 95, 112));

        content.setStrokingColor(new Color(180, 146, 67));
        content.setLineWidth(1f);
        content.moveTo(centerX - 145, height - 134);
        content.lineTo(centerX + 145, height - 134);
        content.stroke();

        writeCentered(content, fonts.bold(), fonts.unicode(), 36, "KATILIM SERTİFİKASI", centerX, height - 178, new Color(16, 24, 48));
        writeCentered(content, fonts.regular(), fonts.unicode(), 14, "Sayın", centerX, height - 224, new Color(86, 95, 112));
        writeCentered(content, fonts.bold(), fonts.unicode(), 30, valueOr(user.getFullName(), user.getEmail()), centerX, height - 260, new Color(34, 42, 74));

        String body = "FMV Işık Üniversitesi bünyesinde, " + formatEventDate(event) + " tarihinde gerçekleştirilen \""
                + valueOr(event.getEventTitle(), title(event)) + "\" etkinliğine gösterdiğiniz aktif katılım ve değerli katkılarınızdan dolayı bu sertifikayı almaya hak kazandınız.";
        writeWrappedCentered(content, fonts.regular(), fonts.unicode(), 13.5f, body, centerX, height - 312, 610, 20, new Color(58, 66, 84));
        writeWrappedCentered(content, fonts.regular(), fonts.unicode(), 13.5f,
                "Topluluğumuza kattığınız enerji ve geleceğe yönelik adımlarınızda başarılar dileriz.",
                centerX, height - 376, 560, 20, new Color(58, 66, 84));

        writeCentered(content, fonts.bold(), fonts.unicode(), 12.5f, valueOr(event.getEventLocation(), "FMV Işık Üniversitesi"), centerX, height - 435, new Color(24, 41, 84));
        writeCentered(content, fonts.regular(), fonts.unicode(), 12, formatIssuedAt(event.getIssuedAt()), centerX, height - 457, new Color(86, 95, 112));

        float signatureY = margin + 122;
        drawSignature(content, fonts, margin + 118, signatureY,
                valueOr(event.getClubName(), "Etkinliği Düzenleyen Kulüp"),
                valueOr(event.getClubPresidentName(), "Kulüp Başkanı"));
        drawSignature(content, fonts, width - margin - 330, signatureY, "FMV Işık Üniversitesi", "SKS Daire Başkanlığı");

        String verificationUrl = verificationUrl(event);
        float qrSize = 54;
        float qrX = width - margin - 92;
        float qrY = margin + 62;
        content.setStrokingColor(new Color(224, 229, 238));
        content.setLineWidth(0.6f);
        content.addRect(qrX - 12, qrY - 24, qrSize + 24, qrSize + 48);
        content.stroke();
        writeCentered(content, fonts.bold(), fonts.unicode(), 8.5f, "Doğrulama", qrX + qrSize / 2, qrY + qrSize + 12, new Color(24, 41, 84));
        drawQrCode(document, content, verificationUrl, qrX, qrY, qrSize);
        write(content, fonts.regular(), fonts.unicode(), 8.3f, "Sertifika No: " + valueOr(event.getCertificateCode(), "-"), margin + 38, margin + 52, new Color(86, 95, 112));
    }

    private void drawSignature(PDPageContentStream content,
                               CertificateFonts fonts,
                               float x,
                               float y,
                               String title,
                               String subtitle) throws Exception {
        content.setStrokingColor(new Color(180, 146, 67));
        content.setLineWidth(0.8f);
        content.moveTo(x, y + 34);
        content.lineTo(x + 190, y + 34);
        content.stroke();
        writeCentered(content, fonts.bold(), fonts.unicode(), 10.5f, title, x + 95, y + 14, new Color(24, 41, 84));
        writeCentered(content, fonts.regular(), fonts.unicode(), 8.8f, subtitle, x + 95, y, new Color(86, 95, 112));
    }

    private void drawUniversityLogo(PDDocument document,
                                    PDPageContentStream content,
                                    float x,
                                    float y,
                                    float targetWidth) throws Exception {
        File logo = Path.of("frontend", "public", "isik-logo.png").toFile();
        if (!logo.exists()) {
            return;
        }

        PDImageXObject image = PDImageXObject.createFromFileByContent(logo, document);
        float ratio = targetWidth / image.getWidth();
        content.drawImage(image, x, y, targetWidth, image.getHeight() * ratio);
    }

    private void drawQrCode(PDDocument document,
                            PDPageContentStream content,
                            String value,
                            float x,
                            float y,
                            float size) throws Exception {
        BitMatrix matrix = new QRCodeWriter().encode(value, BarcodeFormat.QR_CODE, 180, 180);
        BufferedImage image = MatrixToImageWriter.toBufferedImage(matrix);
        PDImageXObject qr = LosslessFactory.createFromImage(document, image);
        content.drawImage(qr, x, y, size, size);
    }

    private CertificateFonts loadFonts(PDDocument document) {
        for (String candidate : List.of(
                "C:\\Windows\\Fonts\\arial.ttf",
                "C:\\Windows\\Fonts\\segoeui.ttf",
                "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")) {
            File file = Path.of(candidate).toFile();
            if (file.exists()) {
                try {
                    PDFont regular = PDType0Font.load(document, file);
                    PDFont bold = PDType0Font.load(document, file);
                    return new CertificateFonts(bold, bold, regular, true);
                } catch (Exception ignored) {
                    // Continue with the next system font candidate.
                }
            }
        }
        return new CertificateFonts(
                new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD),
                new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD),
                new PDType1Font(Standard14Fonts.FontName.HELVETICA),
                false);
    }

    private void fill(PDPageContentStream content,
                      float x,
                      float y,
                      float width,
                      float height,
                      Color color) throws Exception {
        content.setNonStrokingColor(color);
        content.addRect(x, y, width, height);
        content.fill();
    }

    private void writeWrappedCentered(PDPageContentStream content,
                                      PDFont font,
                                      boolean unicode,
                                      float size,
                                      String text,
                                      float centerX,
                                      float y,
                                      float maxWidth,
                                      float lineHeight,
                                      Color color) throws Exception {
        List<String> lines = wrap(font, unicode, size, text, maxWidth);
        for (int i = 0; i < lines.size(); i++) {
            writeCentered(content, font, unicode, size, lines.get(i), centerX, y - (i * lineHeight), color);
        }
    }

    private List<String> wrap(PDFont font,
                              boolean unicode,
                              float size,
                              String text,
                              float maxWidth) throws Exception {
        List<String> lines = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        for (String word : text.split("\\s+")) {
            String candidate = current.isEmpty() ? word : current + " " + word;
            if (font.getStringWidth(pdfText(candidate, unicode)) / 1000 * size <= maxWidth) {
                current = new StringBuilder(candidate);
            } else {
                if (!current.isEmpty()) {
                    lines.add(current.toString());
                }
                current = new StringBuilder(word);
            }
        }
        if (!current.isEmpty()) {
            lines.add(current.toString());
        }
        return lines;
    }

    private void writeCentered(PDPageContentStream content,
                               PDFont font,
                               boolean unicode,
                               float size,
                               String text,
                               float centerX,
                               float y,
                               Color color) throws Exception {
        String safeText = fitToWidth(font, unicode, size, text, 680);
        float textWidth = font.getStringWidth(pdfText(safeText, unicode)) / 1000 * size;
        write(content, font, unicode, size, safeText, centerX - textWidth / 2, y, color);
    }

    private void write(PDPageContentStream content,
                       PDFont font,
                       boolean unicode,
                       float size,
                       String text,
                       float x,
                       float y,
                       Color color) throws Exception {
        content.beginText();
        content.setFont(font, size);
        content.setNonStrokingColor(color);
        content.newLineAtOffset(x, y);
        content.showText(pdfText(text, unicode));
        content.endText();
    }

    private String title(CertificateIssueRequestedEvent event) {
        if (event.getCertificateTitle() != null && !event.getCertificateTitle().isBlank()) {
            return event.getCertificateTitle().trim();
        }
        return event.getEventTitle();
    }

    private String formatEventDate(CertificateIssueRequestedEvent event) {
        String value = event.getEventDate();
        if (value == null || value.isBlank()) {
            value = event.getIssuedAt();
        }
        return formatDate(value, DISPLAY_DATE);
    }

    private String formatIssuedAt(String value) {
        return formatDate(value, ISSUED_DATE);
    }

    private String formatDate(String value, DateTimeFormatter formatter) {
        if (value == null || value.isBlank()) {
            return LocalDateTime.now().format(formatter);
        }
        try {
            return LocalDateTime.parse(value, INPUT_DATE).format(formatter);
        } catch (Exception ignored) {
            return value;
        }
    }

    private String verificationUrl(CertificateIssueRequestedEvent event) {
        return VERIFY_PAGE_BASE_URL + "?code=" + valueOr(event.getCertificateCode(), "");
    }

    private String fitToWidth(PDFont font, boolean unicode, float size, String value, float maxWidth) throws Exception {
        String text = valueOr(value, "");
        while (text.length() > 4 && font.getStringWidth(pdfText(text, unicode)) / 1000 * size > maxWidth) {
            text = text.substring(0, text.length() - 4).trim() + "...";
        }
        return text;
    }

    private String valueOr(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private String pdfText(String value, boolean unicode) {
        if (value == null) {
            return "";
        }
        if (unicode) {
            return value;
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

    private record CertificateFonts(PDFont title, PDFont bold, PDFont regular, boolean unicode) {
    }
}
