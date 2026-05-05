import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import dayjs from "dayjs";
import buddhistEra from "dayjs/plugin/buddhistEra";
import "dayjs/locale/th";
import {
  Meeting,
  DisbursementSummary,
  MeetingParticipant,
} from "@models/meeting";
import { randomString } from ".";

dayjs.extend(buddhistEra);
dayjs.locale("th");

// แปลงตัวเลขเป็นตัวอักษรไทย
function numberToThaiWords(num: number): string {
  const units = [
    "",
    "หนึ่ง",
    "สอง",
    "สาม",
    "สี่",
    "ห้า",
    "หก",
    "เจ็ด",
    "แปด",
    "เก้า",
  ];
  const tens = [
    "",
    "สิบ",
    "ยี่สิบ",
    "สามสิบ",
    "สี่สิบ",
    "ห้าสิบ",
    "หกสิบ",
    "เจ็ดสิบ",
    "แปดสิบ",
    "เก้าสิบ",
  ];
  const scales = ["", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];

  if (num === 0) return "ศูนย์";

  let result = "";
  const numStr = Math.floor(num).toString();
  const decimal = Math.round((num % 1) * 100);

  // ส่วนจำนวนเต็ม
  if (numStr.length > 0) {
    const digits = numStr.split("").map(Number).reverse();

    for (let i = 0; i < digits.length; i++) {
      const digit = digits[i];
      const position = i % 6;
      const scaleIndex = Math.floor(i / 6);

      if (digit !== 0) {
        if (position === 0 && digit === 1 && i > 0) {
          // เอ็ด (11, 21, 31, ...)
          result = "เอ็ด" + (scaleIndex > 0 ? scales[5] : "") + result;
        } else if (position === 0) {
          // หลักหน่วย (1-9)
          result = units[digit] + (scaleIndex > 0 ? scales[5] : "") + result;
        } else if (position === 1 && digit === 1) {
          // สิบ (10, 11, 12, ...)
          result = "สิบ" + result;
        } else if (position === 1 && digit === 2) {
          // ยี่สิบ (20, 21, 22, ...)
          result = "ยี่สิบ" + result;
        } else if (position === 1) {
          // หลักสิบ (30-90)
          result = tens[digit] + result;
        } else if (position === 2) {
          // หลักร้อย (100-900)
          result = units[digit] + scales[1] + result;
        } else {
          // หลักพัน, หมื่น, แสน (position 3, 4, 5)
          result = units[digit] + scales[position - 1] + result;
        }
      } else if (position === 0 && scaleIndex > 0) {
        // หลักล้าน (1,000,000, 2,000,000, ...)
        result = scales[5] + result;
      }
    }
  }

  result += "บาท";

  // ส่วนสตางค์
  if (decimal > 0) {
    if (decimal < 10) {
      result += units[decimal] + "สตางค์";
    } else {
      const satangTens = Math.floor(decimal / 10);
      const satangUnits = decimal % 10;
      if (satangTens === 1) {
        result +=
          "สิบ" + (satangUnits > 0 ? units[satangUnits] : "") + "สตางค์";
      } else if (satangTens === 2) {
        result +=
          "ยี่สิบ" + (satangUnits > 0 ? units[satangUnits] : "") + "สตางค์";
      } else {
        result +=
          tens[satangTens] +
          (satangUnits > 0 ? units[satangUnits] : "") +
          "สตางค์";
      }
    }
  } else {
    result += "ถ้วน";
  }

  return result;
}

interface ExpenseDocumentData {
  meeting: Meeting;
  disbursementSummary: DisbursementSummary;
  participants?: MeetingParticipant[];
  requesterName?: string;
  requesterPosition?: string;
  department?: string;
  phone?: string;
  costCenterCode?: string;
  projectName?: string;
  budgetCode?: string;
  expenseCategoryName?: string;
  fundSourceCode?: string;
  mainActivityName?: string;
  mainActivityCode?: string;
  subActivityName?: string;
  subActivityCode?: string;
  vendorCode?: string;
  poNumber?: string;
  migoNumber?: string;
  bankAccountNumber?: string;
  documentReference?: string;
}

function buildExpenseDetailsTitle(meeting: Meeting): string {
  let details = ` คณะ`;
  if (meeting.committeeName) {
    details += ` ${meeting.committeeName}`;
  }
  if (meeting.committeeNumber) {
    details += ` คณะที่ ${meeting.committeeNumber}`;
  }

  const instanceInfo = meeting.instanceNumber
    ? `ครั้งที่ ${meeting.instanceNumber}/${
        dayjs(meeting.startDate || new Date()).year() + 543
      }`
    : "";
  if (instanceInfo) {
    details += ` ${instanceInfo}`;
  }

  const meetingDate = meeting.startDate
    ? dayjs(meeting.startDate).format("DD MMMM YYYY")
    : "";
  const meetingTime = meeting.startTime || "";

  if (meetingDate) {
    details += ` วันที่ ${meetingDate}`;
  }

  if (meetingTime) {
    details += ` เวลา ${meetingTime}`;
  }

  return details;
}

// สร้างรายละเอียดค่าใช้จ่ายจาก participants
function buildExpenseDetails(expense: any, index: number = 0): string {
  let details = `(${index}) ${expense.expenseTypeName}`;

  return details;
}

// สร้าง HTML สำหรับหน้าเดียว
function createPageHTML(
  data: ExpenseDocumentData,
  pageNumber: number,
  totalPages: number,
  expenseStartIndex: number = 0,
  expenseEndIndex?: number
): string {
  const {
    meeting,
    disbursementSummary,
    participants,
    requesterName = "",
    requesterPosition = "",
    department = "กำหนดมาตรฐาน",
    phone = "1780",
    costCenterCode = "2200700018",
    projectName = "พื้นฐานด้านการสร้างความสามารถในการแข่งขัน",
    budgetCode = "22007290008002000000",
    expenseCategoryName = "งบดำเนินงาน",
    fundSourceCode = "6511200",
    mainActivityName = "กำหนดมาตรฐาน",
    mainActivityCode = "22007660000800000",
    subActivityName = "งานกำหนดมาตรฐานผลิตภัณฑ์อุตสาหกรรม",
    subActivityCode = "660000800000110",
    vendorCode = "",
    poNumber = "",
    migoNumber = "",
    bankAccountNumber = "",
    documentReference = `P${dayjs().year() + 543}-${randomString(10)}`,
  } = data;

  const expenses = disbursementSummary.expenses.slice(
    expenseStartIndex,
    expenseEndIndex
  );
  let totalAmount = disbursementSummary.expenses.reduce(
    (sum, exp) => sum + (exp.actualExpense || 0),
    0
  );

  const totalMeetingAllowance = participants?.reduce(
    (sum, p) => sum + (p.meetingAllowance ? parseFloat(p.meetingAllowance) : 0),
    0
  );
  totalAmount = totalAmount + (totalMeetingAllowance || 0);

  // หน้าแรก: แสดงส่วนหัว, ข้อมูลผู้รับ, ข้อมูลโครงการ, ตารางค่าใช้จ่าย, รวม, และส่วนอนุมัติ
  // หน้าถัดไป: แสดงเฉพาะตารางค่าใช้จ่ายต่อ (ถ้ามี)
  const isFirstPage = pageNumber === 1;
  const showHeader = isFirstPage;
  // const showRecipient = isFirstPage;
  // const showProject = isFirstPage;
  const showTotal =
    isFirstPage &&
    (!expenseEndIndex ||
      expenseEndIndex >= disbursementSummary.expenses.length);
  const isLastExpensePage =
    !expenseEndIndex || expenseEndIndex >= disbursementSummary.expenses.length;
  // const showApproval =
  //   isFirstPage &&
  //   (!expenseEndIndex ||
  //     expenseEndIndex >= disbursementSummary.expenses.length);
  const showFooter = pageNumber === totalPages;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: "Sarabun", "TH Sarabun New", sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: #000;
          background: #fff;
        }
        .document-container {
          width: 210mm;
          min-height: 297mm;
          padding: 15mm;
          margin: 0 auto;
          background: #fff;
          page-break-after: always;
        }
        .header {
          text-align: center;
          margin-bottom: 15px;
        }
        .document-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .document-type-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 10px;
          padding: 8px;
          border: 1px solid #000;
        }
        .document-type-left {
          border-right: 1px solid #000;
          padding-right: 10px;
        }
        .document-type-label {
          font-weight: bold;
          margin-bottom: 5px;
          font-size: 13px;
        }
        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
        }
        .checkbox {
          width: 12px;
          height: 12px;
          border: 1px solid #000;
          flex-shrink: 0;
        }
        .organization-info {
          padding-left: 10px;
        }
        .organization-name {
          font-weight: bold;
          font-size: 13px;
        }
        .recipient-section {
          margin-bottom: 10px;
          padding: 8px;
          border: 1px solid #000;
        }
        .recipient-row {
          display: grid;
          grid-template-columns: 180px 1fr;
          margin-bottom: 4px;
          font-size: 13px;
        }
        .recipient-label {
          font-weight: bold;
        }
        .recipient-value {
          border-bottom: 1px solid #000;
          min-height: 18px;
          padding-left: 5px;
        }
        .project-section {
          margin-bottom: 10px;
          padding: 8px;
          border: 1px solid #000;
        }
        .project-row {
          display: grid;
          grid-template-columns: 180px 1fr 80px 1fr;
          margin-bottom: 4px;
          font-size: 13px;
        }
        .project-row-single {
          display: grid;
          grid-template-columns: 180px 1fr;
          margin-bottom: 4px;
          font-size: 13px;
        }
        .project-label {
          font-weight: bold;
        }
        .project-value {
          padding-left: 5px;
        }
        .project-signature-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 10px;
          font-size: 13px;
        }
        .project-signature-line {
          border-bottom: 1px solid #000;
          min-height: 18px;
          flex: 1;
        }
        .expense-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
          font-size: 13px;
        }
        .expense-table th,
        .expense-table td {
          border: 1px solid #000;
          padding: 6px;
          text-align: left;
          vertical-align: top;
        }
        .expense-table th {
          background-color: #f0f0f0;
          font-weight: bold;
          text-align: center;
        }
        .expense-table td:last-child {
          text-align: right;
        }
        .expense-item-details {
          line-height: 1.4;
        }
        .total-section {
          margin-bottom: 10px;
          padding: 8px;
          border: 1px solid #000;
        }
        .total-row {
          display: grid;
          grid-template-columns: 200px 1fr;
          margin-bottom: 4px;
          font-size: 13px;
        }
        .total-label {
          font-weight: bold;
        }
        .total-value {
          border-bottom: 1px solid #000;
          min-height: 18px;
          padding-left: 5px;
        }
        .total-value-right {
          text-align: right;
          padding-right: 5px;
        }
        .approval-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 10px;
        }
        .approval-box {
          border: 1px solid #000;
          padding: 8px;
          min-height: 180px;
        }
        .approval-title {
          font-weight: bold;
          margin-bottom: 8px;
          font-size: 13px;
        }
        .approval-content {
          font-size: 12px;
          line-height: 1.6;
          margin-bottom: 10px;
        }
        .signature-line {
          margin-top: 15px;
          margin-bottom: 5px;
          font-size: 12px;
        }
        .signature-name {
          border-bottom: 1px solid #000;
          min-height: 18px;
          margin-bottom: 5px;
          padding-left: 5px;
          font-size: 12px;
        }
        .signature-position {
          font-size: 12px;
          margin-bottom: 5px;
        }
        .signature-date {
          font-size: 12px;
        }
        .footer {
          text-align: center;
          margin-top: 15px;
          font-size: 12px;
        }
        .page-number {
          text-align: center;
          margin-top: 10px;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="document-container">
        ${
          showHeader
            ? `
        <div class="header">
          <div class="document-title">ใบเบิกค่าใช้จ่าย</div>
        </div>

        <div class="document-type-section">
          <div class="document-type-left">
            <div class="document-type-label">ประเภทเอกสารเบิก</div>
            <div class="checkbox-group">
              <div class="checkbox-item">
                <div class="checkbox"></div>
                <span>จ่ายตรงผู้ขาย</span>
              </div>
              <div class="checkbox-item">
                <div class="checkbox"></div>
                <span>จ่ายผ่านส่วนราชการ</span>
              </div>
              <div class="checkbox-item">
                <div class="checkbox"></div>
                <span>ส่งชดใช้คืนเงินยืมราชการ</span>
              </div>
            </div>
          </div>
          <div class="organization-info">
            <div class="organization-name">สำนักงานมาตรฐานผลิตภัณฑ์อุตสาหกรรม กระทรวงอุตสาหกรรม</div>
          </div>
        </div>

        <div class="recipient-section">
          <div class="recipient-row">
            <div class="recipient-label">จ่ายให้ เจ้าหนี้/บริษัท/บุคคล</div>
            <div class="recipient-value">${requesterName}</div>
          </div>
          <div class="recipient-row">
            <div class="recipient-label">รหัสผู้ขาย</div>
            <div class="recipient-value">${vendorCode}</div>
          </div>
          <div class="recipient-row">
            <div class="recipient-label">PO</div>
            <div class="recipient-value">${poNumber}</div>
          </div>
          <div class="recipient-row">
            <div class="recipient-label">MIGO</div>
            <div class="recipient-value">${migoNumber}</div>
          </div>
          <div class="recipient-row">
            <div class="recipient-label">เลขบัญชีธนาคาร</div>
            <div class="recipient-value">${bankAccountNumber}</div>
          </div>
        </div>

        <div class="project-section">
          <div class="project-row">
            <div class="project-label">กอง/สำนัก/ศูนย์</div>
            <div class="project-value">${department}</div>
            <div class="project-label">โทร.</div>
            <div class="project-value">${phone}</div>
          </div>
          <div class="project-row-single">
            <div class="project-label">รหัสศูนย์ต้นทุน</div>
            <div class="project-value">${costCenterCode}</div>
          </div>
          <div class="project-row-single">
            <div class="project-label">ชื่อแผนงาน</div>
            <div class="project-value">${projectName}</div>
          </div>
          <div class="project-row-single">
            <div class="project-label">รหัสงบประมาณ</div>
            <div class="project-value">${budgetCode}</div>
          </div>
          <div class="project-row-single">
            <div class="project-label">ชื่อหมวดรายจ่าย</div>
            <div class="project-value">${expenseCategoryName}</div>
          </div>
          <div class="project-row-single">
            <div class="project-label">รหัสแหล่งของเงิน</div>
            <div class="project-value">${fundSourceCode}</div>
          </div>
          <div class="project-row-single">
            <div class="project-label">ชื่อกิจกรรมหลัก</div>
            <div class="project-value">${mainActivityName}</div>
          </div>
          <div class="project-row-single">
            <div class="project-label">รหัสกิจกรรมหลัก</div>
            <div class="project-value">${mainActivityCode}</div>
          </div>
          <div class="project-row-single">
            <div class="project-label">ชื่อกิจกรรมย่อย</div>
            <div class="project-value">${subActivityName}</div>
          </div>
          <div class="project-row-single">
            <div class="project-label">รหัสกิจกรรมย่อย</div>
            <div class="project-value">${subActivityCode}</div>
          </div>
          <div class="project-signature-row">
            <span>ลงชื่อ</span>
            <div class="project-signature-line"></div>
            <span>ผู้บันทึกตัดยอดงบประมาณกอง/สำนัก/ศูนย์</span>
          </div>
        </div>
        `
            : ""
        }

        <table class="expense-table">
          ${
            isFirstPage
              ? `
          <thead>
            <tr>
              <th style="width: 70%;">รายการ</th>
              <th style="width: 30%;">จำนวนเงิน</th>
            </tr>
          </thead>
          `
              : ""
          }
          <tbody>
          <tr>
            <td class="expense-item-details">${buildExpenseDetailsTitle(
              meeting
            )}</td>
            <td></td>
          </tr>
            ${expenses
              .map((expense, idx) => {
                const actualIndex = expenseStartIndex + idx;
                const expenseDetails = buildExpenseDetails(
                  expense,
                  actualIndex + 1
                );
                return `
                  <tr>
                    <td class="expense-item-details">${expenseDetails}</td>
                    <td>${(expense.actualExpense || 0).toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}</td>
                  </tr>
                `;
              })
              .join("")}
            ${
              isLastExpensePage
                ? `
          <tr>
            <td class="expense-item-details">${`ค่าเบี้ยผู้ร่วมประชุม ${participants?.length} คน`}</td>
            <td>${(totalMeetingAllowance || 0).toLocaleString("th-TH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}</td>
          </tr>
          `
                : ""
            }
          </tbody>
        </table>

        ${
          showTotal
            ? `
        <div class="total-section">
          <div class="total-row">
            <div class="total-label">รวมทั้งสิ้น (ตัวอักษร)</div>
            <div class="total-value">${numberToThaiWords(totalAmount)}</div>
          </div>
          <div class="total-row">
            <div class="total-label">รวมทั้งสิ้น (ตัวเลข)</div>
            <div class="total-value total-value-right">
              ${totalAmount.toLocaleString("th-TH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
        </div>

        <div class="approval-section">
          <div class="approval-box">
            <div class="approval-title">1. ผู้เบิก</div>
            <div class="approval-content">
              1. ข้าพเจ้าขอเบิกเงินตามรายการดังปรากฏข้างต้นและได้แนบใบสำคัญ ฉบับ มาเพื่อตรวจจ่ายด้วยแล้ว
            </div>
            <div class="signature-line">ลงชื่อ (ผู้เบิก)</div>
            <div class="signature-name">${requesterName}</div>
            <div class="signature-position">ตำแหน่ง ${requesterPosition}</div>
            <div class="signature-date">วันที่</div>
          </div>

          <div class="approval-box">
            <div class="approval-title">2. ผก.กกค.</div>
            <div class="approval-content">
              2. เรียน ผก.กกค. กลุ่มการคลังตรวจสอบแล้ว
            </div>
            <div class="signature-line">ลงชื่อ (ผู้ตรวจสอบ)</div>
            <div class="signature-name"></div>
            <div class="signature-position">ตำแหน่ง</div>
            <div class="signature-date">วันที่</div>
          </div>

          <div class="approval-box">
            <div class="approval-title">3. ลมอ</div>
            <div class="approval-content">
              3. เรียน ลมอ ได้ตรวจสอบหลักฐานการเบิกจ่ายเงินตามใบสำคัญ รวม...............ฉบับ จํานวน................บาท..............สตางค์
            </div>
            <div class="signature-line">ลงชื่อ (ผก.กกค.)</div>
            <div class="signature-name"></div>
            <div class="signature-position">ตำแหน่ง</div>
            <div class="signature-date">วันที่</div>
          </div>

          <div class="approval-box">
            <div class="approval-title">4. อนุมัติให้จ่ายได้</div>
            <div class="approval-content">
              4. อนุมัติให้จ่ายได้
            </div>
            <div class="signature-line">ลงชื่อ (ลมอ.)</div>
            <div class="signature-name"></div>
            <div class="signature-position">ตำแหน่ง</div>
            <div class="signature-date">วันที่</div>
          </div>
        </div>
        `
            : ""
        }

        ${
          showFooter
            ? `
        <div class="footer">
          <div>เอกสารเบิกจ่าย ระบบ E-Standard</div>
          <div>เลขอ้างอิง ${documentReference}</div>
        </div>
        `
            : ""
        }
        
        ${
          totalPages > 1
            ? `
        <div class="page-number">หน้า ${pageNumber} / ${totalPages}</div>
        `
            : ""
        }
      </div>
    </body>
    </html>
  `;
}

export async function generateExpenseClaimDocument(
  data: ExpenseDocumentData
): Promise<Blob> {
  const { disbursementSummary } = data;

  // คำนวณจำนวนหน้า: ประมาณ 15-20 รายการต่อหน้า (ขึ้นอยู่กับความยาวของรายละเอียด)
  const itemsPerPage = 15;
  const totalItems = disbursementSummary.expenses.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  // เว้นขอบบน/ล่างเพิ่ม เพื่อไม่ให้ข้อความชิดรอยต่อหน้า
  const marginTopMm = 14;
  const firstPageTopMarginMm = 5;
  const marginBottomMm = 16;
  const marginXmm = 6;
  const contentWidthMm = pageWidth - marginXmm * 2;
  const availableHeightMm = pageHeight - marginTopMm - marginBottomMm;
  const firstPageAvailableHeightMm =
    pageHeight - firstPageTopMarginMm - marginBottomMm;
  let isFirstPdfPage = true;

  // สร้างแต่ละหน้า
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const startIndex = (pageNum - 1) * itemsPerPage;
    const endIndex =
      pageNum === totalPages ? undefined : pageNum * itemsPerPage;

    // สร้าง HTML สำหรับหน้านี้
    const htmlContent = createPageHTML(
      data,
      pageNum,
      totalPages,
      startIndex,
      endIndex
    );

    // สร้าง DOM element ชั่วคราว
    const wrapper = document.createElement("div");
    wrapper.style.position = "absolute";
    wrapper.style.left = "-9999px";
    wrapper.style.top = "0";
    wrapper.innerHTML = htmlContent;
    document.body.appendChild(wrapper);

    const contentEl = wrapper.querySelector(
      ".document-container"
    ) as HTMLElement;
    if (!contentEl) {
      wrapper.remove();
      throw new Error("Missing document container");
    }
    const approvalEl = wrapper.querySelector(".approval-section") as
      | HTMLElement
      | null;

    // รอให้ฟอนต์โหลดเสร็จ
    await new Promise((resolve) => setTimeout(resolve, 300));

    // แคปเจอร์ DOM เป็นภาพ
    const canvas = await html2canvas(contentEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: contentEl.scrollWidth,
      logging: false,
    });

    // ตำแหน่งบล็อกอนุมัติใน canvas (ถ้ามี) เพื่อกันการตัดครึ่งบล็อกข้ามหน้า
    const domToCanvasScale =
      contentEl.scrollHeight > 0 ? canvas.height / contentEl.scrollHeight : 1;
    const approvalTopPx =
      approvalEl != null ? approvalEl.offsetTop * domToCanvasScale : null;
    const approvalBottomPx =
      approvalEl != null
        ? (approvalEl.offsetTop + approvalEl.offsetHeight) * domToCanvasScale
        : null;

    // ลบ DOM ชั่วคราว
    wrapper.remove();

    const imgWidthPx = canvas.width;
    const imgHeightPx = canvas.height;
    const mmPerPx = contentWidthMm / imgWidthPx;
    const usableHeightMm = isFirstPdfPage
      ? firstPageAvailableHeightMm
      : availableHeightMm;
    const pageHeightPx = usableHeightMm / mmPerPx;

    // ถ้าภาพสูงเกิน 1 หน้า ให้ตัดเป็นหลายหน้าอัตโนมัติ
    let renderedHeightPx = 0;
    while (renderedHeightPx < imgHeightPx - 0.5) {
      let sliceHeightPx = Math.min(pageHeightPx, imgHeightPx - renderedHeightPx);

      // ถ้าจุดตัดหน้าจะตัดผ่าน approval-section ให้ย้ายทั้งบล็อกไปหน้าใหม่
      if (approvalTopPx != null && approvalBottomPx != null) {
        const currentSliceBottom = renderedHeightPx + sliceHeightPx;
        const willCutApproval =
          renderedHeightPx < approvalTopPx &&
          currentSliceBottom > approvalTopPx &&
          currentSliceBottom < approvalBottomPx;

        if (willCutApproval) {
          const adjustedSlice = approvalTopPx - renderedHeightPx;
          // กันหน้าโล่งมากเกินไป: ถ้าพื้นที่ก่อน approval เหลือน้อยมาก ให้ยอมตัดปกติ
          if (adjustedSlice > pageHeightPx * 0.2) {
            sliceHeightPx = adjustedSlice;
          }
        }
      }

      const sliceHeightMm = sliceHeightPx * mmPerPx;
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = imgWidthPx;
      sliceCanvas.height = Math.ceil(sliceHeightPx);
      const sliceCtx = sliceCanvas.getContext("2d");
      if (!sliceCtx) {
        throw new Error("Unable to create canvas context for PDF slicing");
      }
      sliceCtx.fillStyle = "#ffffff";
      sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      sliceCtx.drawImage(
        canvas,
        0,
        renderedHeightPx,
        imgWidthPx,
        sliceHeightPx,
        0,
        0,
        imgWidthPx,
        sliceHeightPx
      );
      const sliceImgData = sliceCanvas.toDataURL("image/png");

      if (!isFirstPdfPage) {
        pdf.addPage();
      }

      pdf.addImage(
        sliceImgData,
        "PNG",
        marginXmm,
        isFirstPdfPage ? firstPageTopMarginMm : marginTopMm,
        contentWidthMm,
        sliceHeightMm,
        undefined,
        "FAST"
      );

      renderedHeightPx += sliceHeightPx;
      isFirstPdfPage = false;
    }
  }

  // สร้าง Blob
  const pdfBlob = pdf.output("blob");
  return pdfBlob;
}
