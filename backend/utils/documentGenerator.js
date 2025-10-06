// 

const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, AlignmentType, ImageRun, TextRun, Table, TableRow, TableCell, WidthType } = require('docx');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function loadImage(imageUrl) {
  if (!imageUrl) return null;
  try {
    if (imageUrl.startsWith('data:image')) {
      const base64Data = imageUrl.split(',')[1];
      return Buffer.from(base64Data, 'base64');
    }
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      return Buffer.from(response.data, 'binary');
    }
    const imagePath = path.join(__dirname, '..', imageUrl);
    if (fs.existsSync(imagePath)) return fs.readFileSync(imagePath);
  } catch (err) {
    console.log('Image loading error:', err.message);
  }
  return null;
}

// ---------------- PDF ----------------
// async function generatePDF(letter, referee) {
//   return new Promise(async (resolve, reject) => {
//     try {
//       const doc = new PDFDocument({ size: 'A4', margin: 72 });
//       const chunks = [];
//       doc.on('data', c => chunks.push(c));
//       doc.on('end', () => resolve(Buffer.concat(chunks)));
//       doc.on('error', reject);

//       let y = 72;

//       // University logo (top left)
//       if (referee.university_logo_url) {
//         const logo = await loadImage(referee.university_logo_url);
//         if (logo) {
//           doc.image(logo, 72, y, { width: 120 });
//           y += 10; // Small gap after logo
//         }
//       }

//       // Header section - centered and bold
//       doc.font('Times-Bold').fontSize(12);

//       const fullName = referee.fullname || `${referee.firstName} ${referee.lastName}`;

//       // Calculate center position
//       const pageWidth = 595.28; // A4 width in points
//       const margin = 72;
//       const contentWidth = pageWidth - (margin * 2);

//       if (referee.institution) {
//         doc.text(referee.institution, margin, y, { width: contentWidth, align: 'center' });
//         y += 18;
//       }

//       if (referee.department) {
//         doc.text(referee.department, margin, y, { width: contentWidth, align: 'center' });
//         y += 18;
//       }

//       doc.text(fullName, margin, y, { width: contentWidth, align: 'center' });
//       y += 15;

//       if (referee.title) {
//         doc.font('Times-Roman').fontSize(11);
//         doc.text(referee.title, margin, y, { width: contentWidth, align: 'center' });
//         y += 15;
//       }

//       if (referee.email) {
//         doc.font('Times-Roman').fontSize(11);
//         doc.text(`Email: ${referee.email}`, margin, y, { width: contentWidth, align: 'center' });
//         y += 30;
//       }

//       // Date and salutation - right aligned
//       y += 15;
//       const today = new Date();
//       const dateStr = `${referee.city}, ${referee.state}, ${today.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
//       doc.font('Times-Roman').fontSize(11);
//       doc.text(dateStr, margin, y, { width: contentWidth, align: 'right' });
//       y += 20;

//       // doc.text('To Whom It May Concern', margin, y, { width: contentWidth, align: 'right' });
//       // y += 30;

//       // Letter content - extract and clean
//       let content = letter.letter_content || '';

//       // Remove header information and date from content
//       const linesToRemove = [
//         fullName,
//         referee.title,
//         referee.department,
//         referee.institution,
//         referee.city && referee.state ? `${referee.city}, ${referee.state}` : null,
//         referee.email,
//         // 'To Whom It May Concern,',
//         'Yours sincerely,',
//         'Sincerely,'
//       ].filter(Boolean);

//       let lines = content.split('\n').filter(line => {
//         const trimmed = line.trim();
//         if (!trimmed) return false;
//         // Remove date patterns
//         if (/^\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/i.test(trimmed)) return false;
//         // Remove exact header matches
//         if (linesToRemove.some(h => h && trimmed === h)) return false;
//         return true;
//       });

//       // Join and format paragraphs
//       const bodyText = lines.join('\n').trim();
//       const paragraphs = bodyText.split(/\n\s*\n/).filter(p => p.trim());

//       // Write paragraphs with proper spacing
//       doc.fontSize(12);
//       paragraphs.forEach((para, idx) => {
//         doc.text(para.trim(), 72, y, {
//           align: 'justify',
//           lineGap: 3,
//           width: 450,
//           continued: false
//         });
//         y = doc.y + (idx < paragraphs.length - 1 ? 15 : 30);
//       });

//       // Closing
//       doc.text('Yours sincerely,', 72, y);
//       y += 40;

//       // Signature
//       if (letter.include_signature && (letter.signature_url || referee.signature_url)) {
//         const sig = await loadImage(referee.signature_url || letter.signature_url);
//         if (sig) {
//           doc.image(sig, 72, y, { width: 135, height: 45 });
//           y += 50;
//         }
//       }

//       // Footer
//       doc.fontSize(11);
//       doc.text(fullName, 72, y);
//       y += 15;
//       if (referee.title) {
//         doc.text(referee.title, 72, y);
//         y += 15;
//       }
//       if (referee.institution) {
//         doc.text(referee.institution, 72, y);
//       }

//       doc.end();
//     } catch (e) {
//       reject(e);
//     }
//   });
// }

async function generatePDF(letter, referee) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 72 });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      let y = 72;
      const pageBottom = doc.page.height - 72;

      // University logo (top left)
      if (referee.university_logo_url) {
        const logo = await loadImage(referee.university_logo_url);
        if (logo) {
          doc.image(logo, 72, y, { width: 120 });
          y += 10; // Small gap after logo
        }
      }

      // Header section - centered and bold
      doc.font('Times-Bold').fontSize(12);

      const pageWidth = 595.28; // A4 width
      const margin = 72;
      const contentWidth = pageWidth - (margin * 2);

      doc.font('Times-Bold').fontSize(12);
      const fullName = referee.fullname || `${referee.firstName} ${referee.lastName}`;

      // --- Header
      const headerFields = [
        referee.institution,
        referee.department,
        fullName,
        referee.title,
        referee.email ? `Email: ${referee.email}` : null
      ].filter(Boolean);

      for (const field of headerFields) {
        if (y > pageBottom - 50) { // ensure space
          doc.addPage();
          y = 72;
        }
        doc.text(field, margin, y, { width: contentWidth, align: 'center' });
        y += 18;
      }

      // --- Date and salutation
      const today = new Date();
      const dateStr = `${referee.city || ''}${referee.city && referee.state ? ', ' : ''}${referee.state || ''}, ${today.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
      if (y > pageBottom - 50) { doc.addPage(); y = 72; }
      doc.moveDown(1);
      doc.font('Times-Roman').fontSize(11);
      doc.text(dateStr, margin, y, { width: contentWidth, align: 'right' });
      y = doc.y + 25;

      // --- Letter content
      let content = letter.letter_content || '';
      const linesToRemove = [
        fullName,
        referee.title,
        referee.department,
        referee.institution,
        referee.email,
        'Yours sincerely,',
        'Sincerely,'
      ].filter(Boolean);

      const lines = content.split('\n').filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return false;
        if (/^\d{1,2}\s+(January|February|March|...|December)\s+\d{4}$/i.test(trimmed)) return false;
        if (linesToRemove.some(h => h && trimmed === h)) return false;
        return true;
      });

      const paragraphs = lines.join('\n').split(/\n\s*\n/).filter(p => p.trim());

      doc.fontSize(12);
      for (let i = 0; i < paragraphs.length; i++) {
        if (y > pageBottom - 100) {
          doc.addPage();
          y = 72;
        }
        doc.text(paragraphs[i].trim(), margin, y, {
          align: 'justify',
          width: 450,
          lineGap: 3
        });
        y = doc.y + 20;
      }

      // --- Closing
      if (y > pageBottom - 100) { doc.addPage(); y = 72; }
      doc.text('Yours sincerely,', 72, y);
      y += 40;

      // --- Signature
      if (letter.include_signature && (letter.signature_url || referee.signature_url)) {
        const sig = await loadImage(referee.signature_url || letter.signature_url);
        if (sig) {
          if (y > pageBottom - 100) { doc.addPage(); y = 72; }
          doc.image(sig, 72, y, { width: 135, height: 45 });
          y += 50;
        }
      }

      // --- Footer
      doc.fontSize(11);
      if (y > pageBottom - 60) { doc.addPage(); y = 72; }
      doc.text(fullName, 72, y);
      y += 15;
      if (referee.title) { doc.text(referee.title, 72, y); y += 15; }
      if (referee.institution) { doc.text(referee.institution, 72, y); }

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

// ---------------- DOCX ----------------

async function generateDOCX(letter, referee) {
  const children = [];
  const fullName = referee.fullname || `${referee.firstName} ${referee.lastName}`;

  function sanitizeText(text) {
    if (!text) return '';
    // Remove or replace problematic XML characters
    return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }

  // --- Table (Logo + Info)
  let logoCellContent = [];

  if (referee.university_logo_url) {
    try {
      const logo = await loadImage(referee.university_logo_url);
      if (logo) {
        logoCellContent.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new ImageRun({
                data: logo,
                transformation: { width: 130, height: 80 }
              })
            ]
          })
        );
      }
    } catch (err) {
      console.log('Error loading logo for DOCX:', err);
    }
  }

  // fallback blank paragraph if no logo
  if (logoCellContent.length === 0) {
    logoCellContent.push(new Paragraph({ text: '', spacing: { after: 100 } }));
  }

  // --- Header text (always shown)
  const headerTextParagraphs = [];

  if (referee.institution) {
    headerTextParagraphs.push(new Paragraph({
      children: [new TextRun({ text: referee.institution, bold: true, size: 26 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 }
    }));
  }

  if (referee.department) {
    headerTextParagraphs.push(new Paragraph({
      children: [new TextRun({ text: referee.department, bold: true, size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 }
    }));
  }

  headerTextParagraphs.push(new Paragraph({
    children: [new TextRun({ text: fullName, bold: true, size: 24 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 }
  }));

  if (referee.title) {
    headerTextParagraphs.push(new Paragraph({
      text: referee.title,
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 }
    }));
  }

  if (referee.email) {
    headerTextParagraphs.push(new Paragraph({
      text: `Email: ${referee.email}`,
      alignment: AlignmentType.CENTER
    }));
  }

  // --- Table for Header
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: "None" },
      bottom: { style: "None" },
      left: { style: "None" },
      right: { style: "None" },
      insideHorizontal: { style: "None" },
      insideVertical: { style: "None" },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
            children: logoCellContent
          }),
          new TableCell({
            width: { size: 55, type: WidthType.PERCENTAGE },
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
            children: headerTextParagraphs
          })
        ]
      })
    ]
  });

  children.push(headerTable);

  // --- Date and salutation
  const today = new Date();
  const dateStr = `${referee.city}, ${referee.state}, ${today.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
  children.push(new Paragraph({
    text: dateStr,
    alignment: AlignmentType.RIGHT,
    spacing: { before: 200, after: 100 }
  }));

  // children.push(new Paragraph({
  //   text: 'To whomever this may concern',
  //   alignment: AlignmentType.RIGHT,
  //   spacing: { after: 400 }
  // }));

  // --- Clean letter content
  // Then use it in your content cleaning:
  let content = sanitizeText(letter.letter_content || '');
  const linesToRemove = [
    fullName,
    referee.title,
    referee.department,
    referee.institution,
    referee.city && referee.state ? `${referee.city}, ${referee.state}` : null,
    referee.email,
    'Yours sincerely,',
    'Sincerely,'
  ].filter(Boolean);

  let lines = content.split('\n').filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return true; 
    // Remove date patterns (various formats)
    if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}$/i.test(trimmed)) return false;
    if (/^\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/i.test(trimmed)) return false;
    if (/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}$/i.test(trimmed)) return false;
    // Remove exact header matches
    if (linesToRemove.some(h => h && trimmed === h)) return false;
    // Remove standalone "Email:" prefix
    if (trimmed.startsWith('Email:') && trimmed === `Email: ${referee.email}`) return false;
    return true;
  });

  // Body paragraphs
  const bodyText = lines.join('\n').trim();
  const paragraphs = bodyText.split(/\n\s*\n/).filter(p => p.trim());

  paragraphs.forEach(para => {
    children.push(new Paragraph({
      text: para.trim(),
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }));
  });

  // Closing
  children.push(new Paragraph({
    text: 'Yours sincerely,',
    alignment: AlignmentType.LEFT,
    spacing: { after: 600, before: 200 }
  }));

  // Signature
  if (letter.include_signature && (letter.signature_url || referee.signature_url)) {
    const sig = await loadImage(referee.signature_url || letter.signature_url);
    if (sig) {
      children.push(new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [new ImageRun({ data: sig, transformation: { width: 135, height: 45 } })],
        spacing: { after: 100 }
      }));
    }
  }

  // Footer
  children.push(new Paragraph({
    text: fullName,
    alignment: AlignmentType.LEFT,
    spacing: { after: 100 }
  }));

  if (referee.title) {
    children.push(new Paragraph({
      text: referee.title,
      alignment: AlignmentType.LEFT,
      spacing: { after: 100 }
    }));
  }

  if (referee.institution) {
    children.push(new Paragraph({
      text: referee.institution,
      alignment: AlignmentType.LEFT
    }));
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Times New Roman', size: 24 }
        }
      }
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children
    }]
  });

  return await Packer.toBuffer(doc);
}
// ---------------- DOCX ----------------
// async function generateDOCX(letter, referee) {
//   const children = [];
//   const fullName = referee.fullname || `${referee.firstName} ${referee.lastName}`;

//   // University logo (top left)
//   if (referee.university_logo_url) {
//     try {
//       const logo = await loadImage(referee.university_logo_url);
//       if (logo) {
//         children.push(new Paragraph({
//           alignment: AlignmentType.LEFT,
//           children: [new ImageRun({ 
//               data: logo,
//               transformation: { width: 120, height: 70 },
//               floating: {
//                 horizontalPosition: {
//                   relative: 'page',
//                   align: 'left',
//                   offset: 720, // 0.5 inch from left
//                 },
//                 verticalPosition: {
//                   relative: 'page',
//                   offset: 720, // 0.5 inch from top
//                 },
//                 allowOverlap: true,
//                 behindDocument: false, // change to true if you want “behind text”
//                 zIndex: 0
//               }
//           })],
//           spacing: { after: 100 }
//         }));
//       }
//     } catch (err) {
//       console.log('Error loading logo for DOCX:', err);
//     }
//   }

//   // University logo (top left)
//   // if (referee.university_logo_url) {
//   //   try {
//   //     const logo = await loadImage(referee.university_logo_url);
//   //     if (logo) {
//   //       // Word sometimes collapses empty paragraphs with only images,
//   //       // so we give it spacing + a blank text run to force rendering.
//   //       children.push(
//   //         new Paragraph({
//   //           alignment: AlignmentType.LEFT,
//   //           spacing: { before: 200, after: 200 },
//   //           children: [
//   //             new ImageRun({
//   //               data: logo,
//   //               transformation: { width: 120, height: 60 }
//   //             }),
//   //             new TextRun({ text: " ", size: 1 }) // invisible padding fix
//   //           ]
//   //         })
//   //       );
//   //     }
//   //   } catch (err) {
//   //     console.log('Error loading logo for DOCX:', err);
//   //   }
//   // }

//   // Add spacing before header if logo exists
//   // if (referee.university_logo_url) {
//   //   children.push(new Paragraph({
//   //     text: '',
//   //     spacing: { after: 200 }
//   //   }));
//   // }

//   // Header - centered and bold
//   if (referee.institution) {
//     children.push(new Paragraph({
//       children: [new TextRun({ text: referee.institution, bold: true, size: 24 })],
//       alignment: AlignmentType.CENTER,
//       spacing: { after: 100 }
//     }));
//   }

//   if (referee.department) {
//     children.push(new Paragraph({
//       children: [new TextRun({ text: referee.department, bold: true, size: 24 })],
//       alignment: AlignmentType.CENTER,
//       spacing: { after: 100 }
//     }));
//   }

//   children.push(new Paragraph({
//     children: [new TextRun({ text: fullName, bold: true, size: 24 })],
//     alignment: AlignmentType.CENTER,
//     spacing: { after: 100 }
//   }));

//   if (referee.title) {
//     children.push(new Paragraph({
//       text: referee.title,
//       alignment: AlignmentType.CENTER,
//       spacing: { after: 100 }
//     }));
//   }

//   if (referee.email) {
//     children.push(new Paragraph({
//       text: `Email: ${referee.email}`,
//       alignment: AlignmentType.CENTER,
//       spacing: { after: 400 }
//     }));
//   }

//   // Date and salutation - right aligned
//   const today = new Date();
//   const dateStr = `${referee.city || 'Thessaloniki'}, ${today.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
//   children.push(new Paragraph({
//     text: dateStr,
//     alignment: AlignmentType.RIGHT,
//     spacing: { after: 100 }
//   }));

//   // children.push(new Paragraph({
//   //   text: 'To whomever this may concern',
//   //   alignment: AlignmentType.CENTER,
//   //   spacing: { after: 200 }
//   // }));

//   // Clean content
//   let content = letter.letter_content || '';
//   const linesToRemove = [
//     fullName,
//     referee.title,
//     referee.department,
//     referee.institution,
//     referee.city && referee.state ? `${referee.city}, ${referee.state}` : null,
//     referee.email,
//     // 'To Whom It May Concern,',
//     'Yours sincerely,',
//     'Sincerely,'
//   ].filter(Boolean);

//   let lines = content.split('\n').filter(line => {
//     const trimmed = line.trim();
//     if (!trimmed) return false;
//     if (/^\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/i.test(trimmed)) return false;
//     if (linesToRemove.some(h => h && trimmed === h)) return false;
//     return true;
//   });

//   // Body paragraphs
//   const bodyText = lines.join('\n').trim();
//   const paragraphs = bodyText.split('\n\n').filter(p => p.trim());

//   paragraphs.forEach(para => {
//     children.push(new Paragraph({
//       text: para.trim(),
//       alignment: AlignmentType.JUSTIFIED,
//       spacing: { after: 200 }
//     }));
//   });

//   // Closing
//   children.push(new Paragraph({
//     text: 'Yours sincerely,',
//     alignment: AlignmentType.LEFT,
//     spacing: { after: 600, before: 200 }
//   }));

//   // Signature
//   if (letter.include_signature && (letter.signature_url || referee.signature_url)) {
//     const sig = await loadImage(referee.signature_url || letter.signature_url);
//     if (sig) {
//       children.push(new Paragraph({
//         alignment: AlignmentType.LEFT,
//         children: [new ImageRun({ data: sig, transformation: { width: 135, height: 45 } })],
//         spacing: { after: 100 }
//       }));
//     }
//   }

//   // Footer
//   children.push(new Paragraph({
//     text: fullName,
//     alignment: AlignmentType.LEFT,
//     spacing: { after: 100 }
//   }));

//   if (referee.title) {
//     children.push(new Paragraph({
//       text: referee.title,
//       alignment: AlignmentType.LEFT,
//       spacing: { after: 100 }
//     }));
//   }

//   if (referee.institution) {
//     children.push(new Paragraph({
//       text: referee.institution,
//       alignment: AlignmentType.LEFT
//     }));
//   }

//   const doc = new Document({
//     styles: {
//       default: {
//         document: {
//           run: { font: 'Times New Roman', size: 24 }
//         }
//       }
//     },
//     sections: [{
//       properties: {
//         page: {
//           margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
//         }
//       },
//       children
//     }]
//   });

//   return await Packer.toBuffer(doc);
// }

module.exports = { generatePDF, generateDOCX };