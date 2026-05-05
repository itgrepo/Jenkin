import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import QRCode from "qrcode";
import dayjs from "dayjs";
import buddhistEra from "dayjs/plugin/buddhistEra";
import "dayjs/locale/th";

dayjs.extend(buddhistEra);
dayjs.locale("th");

interface MeetingInvitationData {
  // Meeting info
  committeeNumber: string;
  committeeName: string;
  instanceNumber: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  meetingSubject?: string;

  // Invitation info
  meetingFormat: "onsite" | "online" | "hybrid";
  meetingLocation?: string;
  meetingRoom?: string;
  meetingIdOnline?: string;
  passcode?: string;
  meetingLink?: string;

  // Participant info
  participantName: string;
  participantEmail?: string;

  // Document info
  documentNumber?: string; // หมายเลขหนังสือ
  responsiblePerson?: string; // ผู้รับผิดชอบ
  responsiblePersonTitle?: string; // ตำแหน่งผู้รับผิดชอบ
  department?: string; // หน่วยงาน
  phone?: string; // เบอร์โทร
  email?: string; // อีเมล
}

// โหลดรูปตราครุฑ
async function loadGarudaImage(): Promise<string> {
  try {
    const imageUrl = new URL("/src/assets/images/picture1.png", import.meta.url)
      .href;
    const response = await fetch(imageUrl);
    if (!response.ok) {
      try {
        const altResponse = await fetch("/src/assets/images/picture1.png");
        if (!altResponse.ok) {
          return "";
        }
        const blob = await altResponse.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch {
        return "";
      }
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error loading Garuda image:", error);
    return "";
  }
}

// สร้าง QR Code
async function generateQRCode(data: string): Promise<string> {
  try {
    const qrDataUrl = await QRCode.toDataURL(data, {
      width: 150,
      margin: 1,
    });
    return qrDataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    return "";
  }
}

// แปลงวันที่เป็น พ.ศ.
function formatBuddhistDate(date: string): string {
  const d = dayjs(date);
  const buddhistYear = d.year() + 543;
  const monthNames = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];
  return `${d.date()} ${monthNames[d.month()]} ${buddhistYear}`;
}

// สร้าง HTML template สำหรับหนังสือเชิญประชุม
function createInvitationHTML(
  data: MeetingInvitationData,
  garudaImage: string,
  qrCodeImage: string
): string {
  const currentDate = formatBuddhistDate(dayjs().format("YYYY-MM-DD"));
  const meetingDate = formatBuddhistDate(data.startDate);
  const dayOfWeek = dayjs(data.startDate).format("dddd");
  const dayNames: Record<string, string> = {
    Sunday: "อาทิตย์",
    Monday: "จันทร์",
    Tuesday: "อังคาร",
    Wednesday: "พุธ",
    Thursday: "พฤหัสบดี",
    Friday: "ศุกร์",
    Saturday: "เสาร์",
  };

  // สร้างเนื้อหาการประชุมในย่อหน้าเดียว (ตามรูปแบบในรูป)
  let meetingBodyText = `ด้วยคณะกรรมการวิชาการรายสาขา คณะที่ ${
    data.committeeNumber
  } ${data.committeeName} กำหนดให้มีการประชุมครั้งที่ ${
    data.instanceNumber
  } ในวัน${dayNames[dayOfWeek] || dayOfWeek}ที่ ${meetingDate} เวลา ${
    data.startTime
  } - ${data.endTime} น.`;

  if (data.meetingFormat === "online") {
    const platform = data.meetingIdOnline || "Zoom";
    meetingBodyText += ` ผ่านสื่ออิเล็กทรอนิกส์ (${platform})`;
    if (data.meetingIdOnline || data.passcode || data.meetingLink) {
      meetingBodyText += ` โดยท่านสามารถเข้าร่วมประชุมผ่านทาง QR Code ที่ปรากฏด้านล่าง`;
      if (data.meetingIdOnline) {
        meetingBodyText += ` Meeting ID: ${data.meetingIdOnline}`;
      }
      if (data.passcode) {
        meetingBodyText += ` Passcode: ${data.passcode}`;
      }
      if (data.meetingLink) {
        meetingBodyText += ` หรือ <a href="${data.meetingLink}" target="_blank">${data.meetingLink}</a>`;
      }
    }
  } else if (data.meetingFormat === "onsite") {
    if (data.meetingLocation) {
      meetingBodyText += ` ณ สถานที่ ${data.meetingLocation}`;
    }
    if (data.meetingRoom) {
      meetingBodyText += ` ห้อง ${data.meetingRoom}`;
    }
  } else if (data.meetingFormat === "hybrid") {
    meetingBodyText += ` ผ่านสื่ออิเล็กทรอนิกส์ และสถานที่ ${
      data.meetingLocation || ""
    }`;
    if (data.meetingRoom) {
      meetingBodyText += ` ห้อง ${data.meetingRoom}`;
    }
    if (data.meetingIdOnline || data.passcode || data.meetingLink) {
      meetingBodyText += ` โดยท่านสามารถเข้าร่วมประชุมผ่านทาง QR Code ที่ปรากฏด้านล่าง`;
      if (data.meetingIdOnline) {
        meetingBodyText += ` Meeting ID: ${data.meetingIdOnline}`;
      }
      if (data.passcode) {
        meetingBodyText += ` Passcode: ${data.passcode}`;
      }
      if (data.meetingLink) {
        meetingBodyText += ` หรือ <a href="${data.meetingLink}" target="_blank">${data.meetingLink}</a>`;
      }
    }
  }

  meetingBodyText += ` ตามระเบียบวาระการประชุมรายละเอียดดังสิ่งที่ส่งมาด้วย`;

  const qrData = data.meetingLink || data.meetingIdOnline || "";
//ใช้ padding shorthand: 70px 60px 50px 60px (top, right, bottom, left) หรือ หน้า ขวา ล่าง ซ้าย
  return `
    <style>
      body, .pdf-root {
        font-family: 'TH Sarabun New', 'Sarabun', 'Kanit', 'Prompt', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        font-size: 16px;
        line-height: 1.8;
        margin: 0;
        padding: 0;
        background-color: #ffffff;
        color: #000000;
      }
      .pdf-container {
        width: 794px;
        margin: 0 auto;
        padding: 80px 60px 50px 60px;
        box-sizing: border-box;
      }
      .header-section {
        position: relative;
        margin-bottom: 25px;
        min-height: 140px;
      }
      .document-number {
        font-size: 15px;
        position: absolute;
        left: 0;
        top: 50px;
      }
      .garuda-container {
        position: absolute;
        left: 50%;
        top: 0;
        transform: translateX(-50%);
        text-align: center;
      }
      .garuda-image {
        width: 100px;
        height: 100px;
        object-fit: contain;
      }
      .committee-info {
        position: absolute;
        right: 0;
        top: 50px;
        text-align: left;
        font-size: 15px;
        line-height: 1.5;
      }
      .date-section {
        text-align: center;
        font-size: 15px;
        margin-top: 30px;
        margin-bottom: 10px;
      }
      .subject-section {
        font-size: 15px;
        line-height: 1.5;
         margin-bottom: 5px;
      }
      .recipient-section {
        font-size: 15px;
         margin-bottom: 5px;
      }
      .enclosure-section {
        font-size: 15px;
        margin-bottom: 10px;
      }
      .body-text {
        font-size: 15px;
        line-height: 1.5;
        margin-bottom: 10px;
        text-align: justify;
        text-indent: 8em;
        padding-left: 0;
      }
      .closing-section {
        font-size: 15px;
        line-height: 1.5;
        margin-top: 10px;
        margin-bottom: 20px;
        text-align: justify;
        text-indent: 8em;
      }
      .closing-section > div:first-child {
        text-indent: 0;
      }
      .signature-section {
        font-size: 15px;
        line-height: 1.5;
        margin-top: 40px;
        margin-bottom: 30px;
        text-align: center;
      }
      .signature-line {
        margin-bottom: 3px;
      }
      .footer-section {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-top: 100px;
        padding-bottom: 20px;
      }
      .contact-info {
        font-size: 15px;
        line-height: 1.5;
      }
      .qr-section {
        text-align: center;
        flex-shrink: 0;
      }
      .qr-code {
        width: 110px;
        height: 110px;
        margin-bottom: 8px;
      }
      .qr-text {
        font-size: 14px;
        line-height: 1.5;
      }
    </style>
    <div class="pdf-root">
      <div class="pdf-container" id="pdf-content">
        <div class="header-section">
          ${
            data.documentNumber
              ? `<div class="document-number">${data.documentNumber}</div>`
              : ""
          }
          <div class="garuda-container">
            ${
              garudaImage
                ? `<img src="${garudaImage}" alt="Garuda" class="garuda-image" />`
                : ""
            }
          </div>
          <div class="committee-info">
            <div>กรรมการวิชาการรายสาขา คณะที่ ${data.committeeNumber}</div>
            <div>${data.committeeName}</div>
            <div>สำนักงานมาตรฐานผลิตภัณฑ์อุตสาหกรรม</div>
            <div>ถนนพระรามที่ 6 เขตราชเทวี กรุงเทพฯ 10400</div>
          </div>
        </div>

        <div class="date-section">${currentDate}</div>
        <div class="subject-section">เรื่อง &nbsp;&nbsp;&nbsp;&nbsp; เชิญประชุมคณะกรรมการวิชาการรายสาขา คณะที่ ${
          data.committeeNumber
        } ครั้งที่ ${data.instanceNumber}</div>
        <div class="recipient-section">เรียน &nbsp;&nbsp;&nbsp;&nbsp; ${data.participantName}</div>
        <div class="enclosure-section">สิ่งที่ส่งมาด้วย &nbsp;&nbsp;&nbsp;&nbsp; ระเบียบวาระการประชุม จำนวน 1 ฉบับ</div>
        <div class="body-text">
          ${meetingBodyText}
        </div>
        <div class="closing-section">
         จึงเรียนมาเพื่อโปรดเข้าร่วมประชุม ตามกำหนดวัน เวลา และสถานที่ดังกล่าวด้วย และขอขอบคุณมา ณ ที่นี้
        </div>
        <div class="signature-section">
        <div style="margin-top: 25px; text-align: center;margin-bottom: 40px;">ขอแสดงความนับถือ</div>
          ${
            data.responsiblePerson
              ? `<div class="signature-line">(${data.responsiblePerson})</div>`
              : ""
          }
          ${
            data.responsiblePersonTitle
              ? `<div class="signature-line">${data.responsiblePersonTitle}</div>`
              : ""
          }
        </div>

        <div class="footer-section">
          <div class="contact-info">
            ${
              data.department
                ? data.department
                    .split("\n")
                    .map((line) => `<div>${line}</div>`)
                    .join("")
                : ""
            }
            ${data.phone ? `<div>โทรศัพท์ <a href="tel:${data.phone}" target="_blank">${data.phone}</a></div>` : ""}
            ${
              data.email
                ? `<div>ไปรษณีย์อิเล็กทรอนิกส์ <a href="mailto:${data.email}" target="_blank">${data.email}</a></div>`
                : ""
            }
          </div>
          ${
            qrCodeImage && qrData
              ? `
            <div class="qr-section">
              <img src="${qrCodeImage}" alt="QR Code" class="qr-code" />
              <div class="qr-text">Link สำหรับ<br/>เข้าร่วมประชุม</div>
            </div>
          `
              : ""
          }
        </div>
      </div>
    </div>
  `;
}

// สร้างหนังสือเชิญประชุม PDF หลายหน้า (สำหรับหลายผู้เข้าร่วมประชุม)
export async function generateInvitationLetterPDFMultiPage(
  baseData: Omit<MeetingInvitationData, "participantName" | "participantEmail">,
  participants: Array<{ name: string; email?: string }>
): Promise<Blob> {
  // โหลดรูปตราครุฑ (โหลดครั้งเดียว)
  const garudaImage = await loadGarudaImage();

  // สร้าง QR Code (โหลดครั้งเดียว)
  const qrData = baseData.meetingLink || baseData.meetingIdOnline || "";
  const qrCodeImage = qrData ? await generateQRCode(qrData) : "";

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();

  // สร้างแต่ละหน้า
  for (let i = 0; i < participants.length; i++) {
    const participant = participants[i];

    // ถ้าไม่ใช่หน้าแรก ให้เพิ่มหน้าใหม่
    if (i > 0) {
      pdf.addPage();
    }

    // สร้าง HTML สำหรับผู้เข้าร่วมประชุมคนนี้
    const htmlContent = createInvitationHTML(
      {
        ...baseData,
        participantName: participant.name,
        participantEmail: participant.email,
      },
      garudaImage,
      qrCodeImage
    );

    // สร้าง DOM ชั่วคราวนอกจอเพื่อแคปเจอร์
    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.left = "-10000px";
    wrapper.style.top = "0";
    wrapper.style.width = "794px";
    wrapper.innerHTML = htmlContent;
    document.body.appendChild(wrapper);

    const contentEl = wrapper.querySelector("#pdf-content") as HTMLElement;
    if (!contentEl) {
      wrapper.remove();
      throw new Error("Missing #pdf-content");
    }

    // รอให้รูปภาพและฟอนต์โหลดเสร็จ
    await new Promise((resolve) => setTimeout(resolve, 500));

    // แคปเจอร์ DOM เป็นภาพ
    const canvas = await html2canvas(contentEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: contentEl.scrollWidth,
      logging: false,
    });

    // ลบ DOM ชั่วคราว
    wrapper.remove();

    const imgData = canvas.toDataURL("image/png");

    // แปลงสัดส่วนภาพให้พอดีหน้า
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    // วางภาพใน PDF
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
  }

  // สร้าง Blob
  const pdfBlob = pdf.output("blob");
  return pdfBlob;
}

// สร้างหนังสือเชิญประชุม PDF (สำหรับผู้เข้าร่วมประชุมคนเดียว)
export async function generateInvitationLetterPDF(
  data: MeetingInvitationData
): Promise<Blob> {
  // โหลดรูปตราครุฑ
  const garudaImage = await loadGarudaImage();

  // สร้าง QR Code
  const qrData = data.meetingLink || data.meetingIdOnline || "";
  const qrCodeImage = qrData ? await generateQRCode(qrData) : "";

  // สร้าง HTML
  const htmlContent = createInvitationHTML(data, garudaImage, qrCodeImage);

  // สร้าง DOM ชั่วคราวนอกจอเพื่อแคปเจอร์
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "-10000px";
  wrapper.style.top = "0";
  wrapper.style.width = "794px";
  wrapper.innerHTML = htmlContent;
  document.body.appendChild(wrapper);

  const contentEl = wrapper.querySelector("#pdf-content") as HTMLElement;
  if (!contentEl) {
    wrapper.remove();
    throw new Error("Missing #pdf-content");
  }

  // รอให้รูปภาพและฟอนต์โหลดเสร็จ
  await new Promise((resolve) => setTimeout(resolve, 500));

  // แคปเจอร์ DOM เป็นภาพ
  const canvas = await html2canvas(contentEl, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    windowWidth: contentEl.scrollWidth,
    logging: false,
  });

  // ลบ DOM ชั่วคราว
  wrapper.remove();

  const imgData = canvas.toDataURL("image/png");

  // สร้าง PDF
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();

  // แปลงสัดส่วนภาพให้พอดีหน้า
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pageWidth;
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  // วางภาพใน PDF
  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");

  // สร้าง Blob
  const pdfBlob = pdf.output("blob");
  return pdfBlob;
}
