import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export class ContractPDFGenerator {
  constructor() {
    this.doc = null;
  }

  generateContract(contractData) {
    return new Promise((resolve, reject) => {
      try {
        // Tạo PDF document
        this.doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });

        // Tạo file path tạm
        const fileName = `contract_${contractData.contractId}_${Date.now()}.pdf`;
        const filePath = path.join(process.cwd(), 'temp', fileName);
        
        // Tạo thư mục temp nếu chưa có
        const tempDir = path.dirname(filePath);
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        // Tạo write stream
        const stream = fs.createWriteStream(filePath);
        this.doc.pipe(stream);

        // Thêm nội dung PDF
        this.addHeader(contractData);
        this.addContractInfo(contractData);
        this.addVehicleInfo(contractData);
        this.addPaymentInfo(contractData);
        this.addTermsAndConditions(contractData);
        this.addSignatureSection(contractData);
        this.addFooter();

        // Kết thúc document
        this.doc.end();

        // Xử lý khi PDF được tạo xong
        stream.on('finish', () => {
          resolve({
            filePath,
            fileName,
            size: fs.statSync(filePath).size
          });
        });

        stream.on('error', (error) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  addHeader(contractData) {
    // Logo và header
    this.doc
      .fontSize(24)
      .fillColor('#3563E9')
      .font('Helvetica-Bold')
      .text('MORENT CAR RENTAL AGREEMENT', 50, 50, { align: 'center' });

    this.doc
      .fontSize(12)
      .fillColor('#666')
      .font('Helvetica')
      .text('Smart Contract-Based Vehicle Rental Service', 50, 85, { align: 'center' });

    // Line separator
    this.doc
      .moveTo(50, 110)
      .lineTo(545, 110)
      .stroke('#3563E9');

    this.doc.moveDown(2);
  }

  addContractInfo(contractData) {
    const y = this.doc.y;

    this.doc
      .fontSize(16)
      .fillColor('#333')
      .font('Helvetica-Bold')
      .text('CONTRACT INFORMATION', 50, y);

    this.doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#000')
      .text(`Contract ID: ${contractData.contractId}`, 50, y + 30)
      .text(`Contract Type: ${contractData.contractType.toUpperCase()}`, 50, y + 50)
      .text(`Created Date: ${new Date().toLocaleDateString('vi-VN')}`, 50, y + 70)
      .text(`Blockchain Address: ${contractData.contractAddress}`, 50, y + 90)
      .text(`Transaction Hash: ${contractData.txHash}`, 50, y + 110);

    if (contractData.contractType === 'rental') {
      this.doc
        .text(`Rental Period: ${contractData.startDate} to ${contractData.endDate}`, 50, y + 130);
    }

    this.doc.moveDown(2);
  }

  addVehicleInfo(contractData) {
    const y = this.doc.y;

    this.doc
      .fontSize(16)
      .fillColor('#333')
      .font('Helvetica-Bold')
      .text('VEHICLE INFORMATION', 50, y);

    this.doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#000')
      .text(`Vehicle: ${contractData.carName}`, 50, y + 30)
      .text(`Brand: ${contractData.carBrand}`, 50, y + 50)
      .text(`Car ID: ${contractData.carId}`, 50, y + 70);

    if (contractData.carDescription) {
      this.doc.text(`Description: ${contractData.carDescription}`, 50, y + 90);
    }

    this.doc.moveDown(2);
  }

  addPaymentInfo(contractData) {
    const y = this.doc.y;

    this.doc
      .fontSize(16)
      .fillColor('#333')
      .font('Helvetica-Bold')
      .text('PAYMENT INFORMATION', 50, y);

    if (contractData.contractType === 'purchase') {
      this.doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#000')
        .text(`Total Purchase Price: ${contractData.totalPrice} CPT`, 50, y + 30);

      if (contractData.paymentType === 'quarterly') {
        this.doc
          .text(`Payment Type: Quarterly Payment Plan`, 50, y + 50)
          .text(`Number of Quarters: ${contractData.quarters}`, 50, y + 70)
          .text(`Amount per Quarter: ${contractData.quarterlyAmount} CPT`, 50, y + 90)
          .text(`Payment Duration: ${contractData.quarters * 3} months`, 50, y + 110);

        // Payment schedule table
        let tableY = y + 140;
        this.doc
          .font('Helvetica-Bold')
          .text('Payment Schedule:', 50, tableY);

        tableY += 25;
        this.doc
          .fontSize(10)
          .text('Quarter', 50, tableY)
          .text('Due Date', 150, tableY)
          .text('Amount (CPT)', 250, tableY)
          .text('Status', 350, tableY);

        tableY += 15;
        this.doc
          .moveTo(50, tableY)
          .lineTo(450, tableY)
          .stroke('#ccc');

        // Generate payment schedule
        const startDate = new Date(contractData.startDate || new Date());
        for (let i = 1; i <= contractData.quarters; i++) {
          tableY += 20;
          const dueDate = new Date(startDate);
          dueDate.setMonth(startDate.getMonth() + (i - 1) * 3);
          
          this.doc
            .fontSize(10)
            .font('Helvetica')
            .text(`${i}`, 50, tableY)
            .text(dueDate.toLocaleDateString('vi-VN'), 150, tableY)
            .text(contractData.quarterlyAmount, 250, tableY)
            .text(i === 1 ? 'Paid' : 'Pending', 350, tableY);
        }
      } else {
        this.doc
          .text(`Payment Type: Full Payment`, 50, y + 50)
          .text(`Payment Status: Completed`, 50, y + 70);
      }
    } else {
      // Rental payment info
      this.doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#000')
        .text(`Rental Amount: ${contractData.rentalAmount} CPT`, 50, y + 30)
        .text(`Payment Status: Paid`, 50, y + 50);
    }

    this.doc.moveDown(3);
  }

  addTermsAndConditions(contractData) {
    const y = this.doc.y;

    this.doc
      .fontSize(16)
      .fillColor('#333')
      .font('Helvetica-Bold')
      .text('TERMS AND CONDITIONS', 50, y);

    const terms = [
      '1. This agreement is governed by smart contract technology on the blockchain.',
      '2. All payments must be made in CPT (CarPay Token) cryptocurrency.',
      '3. The vehicle must be returned in the same condition as received.',
      '4. Any damages will be assessed and charged separately.',
      '5. Late payment fees may apply for overdue installments.',
      '6. This contract is binding and enforceable through blockchain technology.',
      '7. Both parties agree to the terms by digitally signing this agreement.',
      '8. Disputes will be resolved according to the smart contract logic.'
    ];

    if (contractData.contractType === 'purchase') {
      terms.push('9. Ownership transfer will occur upon completion of all payments.');
      if (contractData.paymentType === 'quarterly') {
        terms.push('10. Failure to make quarterly payments may result in contract termination.');
      }
    }

    this.doc.fontSize(10).font('Helvetica').fillColor('#000');
    let termY = y + 30;
    
    terms.forEach(term => {
      this.doc.text(term, 50, termY, { width: 495, align: 'justify' });
      termY += 20;
    });

    this.doc.moveDown(2);
  }

  addSignatureSection(contractData) {
    const y = this.doc.y;

    this.doc
      .fontSize(16)
      .fillColor('#333')
      .font('Helvetica-Bold')
      .text('DIGITAL SIGNATURES', 50, y);

    // Owner signature
    this.doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#000')
      .text('Car Owner:', 50, y + 40)
      .text(`Wallet Address: ${contractData.ownerWallet || 'To be signed'}`, 50, y + 60)
      .text('Signature Status: Pending', 50, y + 80);

    // User signature  
    this.doc
      .text('Renter/Buyer:', 300, y + 40)
      .text(`Wallet Address: ${contractData.userWallet}`, 300, y + 60)
      .text('Signature Status: Pending', 300, y + 80);

    // Signature lines
    this.doc
      .moveTo(50, y + 120)
      .lineTo(200, y + 120)
      .stroke('#ccc');

    this.doc
      .moveTo(300, y + 120)
      .lineTo(450, y + 120)
      .stroke('#ccc');

    this.doc
      .fontSize(10)
      .text('Owner Signature', 50, y + 130)
      .text('Renter/Buyer Signature', 300, y + 130);

    this.doc.moveDown(2);
  }

  addFooter() {
    const y = 750; // Near bottom of page

    this.doc
      .fontSize(8)
      .fillColor('#666')
      .text('This document is generated automatically by MORENT smart contract system.', 50, y, { align: 'center' })
      .text(`Generated on: ${new Date().toLocaleString('vi-VN')}`, 50, y + 12, { align: 'center' })
      .text('For support, contact: support@morent.com', 50, y + 24, { align: 'center' });
  }

  // Cleanup temporary files
  static cleanup(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('Temporary PDF file cleaned up:', filePath);
      }
    } catch (error) {
      console.error('Error cleaning up PDF file:', error);
    }
  }
}

export default ContractPDFGenerator;