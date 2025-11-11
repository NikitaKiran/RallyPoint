const PDFDocument = require('pdfkit');

/**
 * Generate tournament results PDF
 * @param {Object} tournament - Tournament document
 * @param {Array} categories - Array of category documents
 * @param {Array} matches - Array of match documents
 * @returns {PDFDocument} - PDF document stream
 */
const generateTournamentPDF = (tournament, categories, matches) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Title
  doc.fontSize(20).font('Helvetica-Bold').text(tournament.name, { align: 'center' });
  doc.moveDown(0.5);
  
  // Tournament details
  doc.fontSize(12).font('Helvetica');
  doc.text(`Tournament Code: ${tournament.code}`, { align: 'center' });
  doc.text(`Date: ${formatDate(tournament.startDate)} - ${formatDate(tournament.endDate)}`, { align: 'center' });
  doc.text(`Status: ${tournament.status.toUpperCase()}`, { align: 'center' });
  doc.moveDown(1);

  // Add line separator
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(1);

  // Group matches by category
  const matchesByCategory = {};
  matches.forEach(match => {
    const categoryId = match.categoryId._id ? match.categoryId._id.toString() : match.categoryId.toString();
    if (!matchesByCategory[categoryId]) {
      matchesByCategory[categoryId] = [];
    }
    matchesByCategory[categoryId].push(match);
  });

  // Process each category
  categories.forEach(category => {
    const categoryId = category._id.toString();
    const categoryMatches = matchesByCategory[categoryId] || [];

    if (categoryMatches.length === 0) return;

    // Category header
    doc.fontSize(16).font('Helvetica-Bold').text(category.name, { underline: true });
    doc.moveDown(0.5);

    // Check if we need to add a new page
    if (doc.y > 650) {
      doc.addPage();
    }

    // Group matches by stage
    const matchesByStage = {};
    categoryMatches.forEach(match => {
      const stageName = match.stageName || 'Unknown Stage';
      if (!matchesByStage[stageName]) {
        matchesByStage[stageName] = [];
      }
      matchesByStage[stageName].push(match);
    });

    // Process each stage
    Object.keys(matchesByStage).forEach(stageName => {
      const stageMatches = matchesByStage[stageName];
      
      doc.fontSize(14).font('Helvetica-Bold').text(stageName);
      doc.moveDown(0.3);

      // Sort matches by match number or date
      stageMatches.sort((a, b) => {
        if (a.matchNumber && b.matchNumber) {
          return a.matchNumber - b.matchNumber;
        }
        return new Date(a.schedule.date) - new Date(b.schedule.date);
      });

      // Display matches
      stageMatches.forEach(match => {
        // Check if we need to add a new page
        if (doc.y > 700) {
          doc.addPage();
        }

        const player1 = match.players[0]?.teamName || match.players[0]?.name || 'TBD';
        const player2 = match.players[1]?.teamName || match.players[1]?.name || 'TBD';
        
        doc.fontSize(11).font('Helvetica');
        
        // Match info line
        let matchInfo = '';
        if (match.matchNumber) {
          matchInfo += `Match ${match.matchNumber}: `;
        }
        if (match.roundName) {
          matchInfo += `${match.roundName} - `;
        }
        matchInfo += `${player1} vs ${player2}`;
        
        doc.text(matchInfo);

        // Schedule and court info
        const scheduleInfo = [];
        if (match.schedule?.date) {
          scheduleInfo.push(`Date: ${formatDate(match.schedule.date)}`);
        }
        if (match.schedule?.time) {
          scheduleInfo.push(`Time: ${match.schedule.time}`);
        }
        if (match.schedule?.courtNumber) {
          scheduleInfo.push(`Court: ${match.schedule.courtNumber}`);
        }
        
        if (scheduleInfo.length > 0) {
          doc.fontSize(10).text(`  ${scheduleInfo.join(' | ')}`, { indent: 20 });
        }

        // Score and result
        if (match.status === 'completed' || match.status === 'walkover') {
          let resultText = '  ';
          
          if (match.status === 'walkover') {
            resultText += 'WALKOVER';
          } else if (match.scores && match.scores.length > 0) {
            const scoreStr = match.scores.map(s => `${s.player1Score}-${s.player2Score}`).join(', ');
            resultText += `Score: ${scoreStr}`;
          }

          if (match.winnerId) {
            const winnerPlayer = match.players.find(p => 
              p.playerId.toString() === match.winnerId.toString()
            );
            const winnerName = winnerPlayer?.teamName || winnerPlayer?.name || 'Unknown';
            resultText += ` | Winner: ${winnerName}`;
          }

          doc.fontSize(10).font('Helvetica-Bold').text(resultText, { indent: 20 });
        } else {
          doc.fontSize(10).font('Helvetica-Oblique').text(`  Status: ${match.status}`, { indent: 20 });
        }

        doc.moveDown(0.5);
      });

      doc.moveDown(0.5);
    });

    doc.moveDown(1);
  });

  // Add footer with generation date
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).font('Helvetica').text(
      `Generated on ${new Date().toLocaleString()} | Page ${i + 1} of ${pageCount}`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    );
  }

  return doc;
};

/**
 * Generate bracket visualization PDF for knockout stages
 * @param {Object} tournament - Tournament document
 * @param {Object} category - Category document
 * @param {Array} matches - Array of match documents for the category
 * @returns {PDFDocument} - PDF document stream
 */
const generateBracketPDF = (tournament, category, matches) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });

  // Title
  doc.fontSize(18).font('Helvetica-Bold').text(tournament.name, { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(14).font('Helvetica').text(category.name, { align: 'center' });
  doc.moveDown(1);

  // Filter knockout matches only
  const knockoutMatches = matches.filter(m => 
    m.stageName && m.stageName.toLowerCase().includes('knockout')
  );

  if (knockoutMatches.length === 0) {
    doc.fontSize(12).text('No knockout matches found for this category.', { align: 'center' });
    return doc;
  }

  // Group matches by round
  const matchesByRound = {};
  knockoutMatches.forEach(match => {
    const roundName = match.roundName || 'Round';
    if (!matchesByRound[roundName]) {
      matchesByRound[roundName] = [];
    }
    matchesByRound[roundName].push(match);
  });

  // Sort rounds (Final, Semi-Final, Quarter-Final, etc.)
  const roundOrder = ['Final', 'Semi-Final', 'Quarter-Final', 'Round of 16', 'Round of 32'];
  const sortedRounds = Object.keys(matchesByRound).sort((a, b) => {
    const indexA = roundOrder.findIndex(r => a.includes(r));
    const indexB = roundOrder.findIndex(r => b.includes(r));
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexB - indexA; // Reverse order (earlier rounds first)
  });

  // Draw bracket structure
  const startX = 80;
  let currentX = startX;
  const columnWidth = 150;
  const matchHeight = 60;
  const startY = 100;

  sortedRounds.forEach((roundName, roundIndex) => {
    const roundMatches = matchesByRound[roundName];
    const matchCount = roundMatches.length;
    
    // Round header
    doc.fontSize(12).font('Helvetica-Bold').text(
      roundName,
      currentX,
      startY - 30,
      { width: columnWidth, align: 'center' }
    );

    // Calculate vertical spacing
    const totalHeight = matchCount * matchHeight;
    const spacing = (doc.page.height - 200 - totalHeight) / (matchCount + 1);

    // Draw matches
    roundMatches.forEach((match, matchIndex) => {
      const y = startY + (matchIndex * (matchHeight + spacing));
      
      // Draw match box
      doc.rect(currentX, y, columnWidth - 20, matchHeight).stroke();

      // Player names
      const player1 = match.players[0]?.teamName || match.players[0]?.name || 'TBD';
      const player2 = match.players[1]?.teamName || match.players[1]?.name || 'TBD';

      doc.fontSize(10).font('Helvetica');
      doc.text(player1, currentX + 5, y + 10, { width: columnWidth - 30 });
      doc.text(player2, currentX + 5, y + 35, { width: columnWidth - 30 });

      // Draw line between players
      doc.moveTo(currentX, y + matchHeight / 2).lineTo(currentX + columnWidth - 20, y + matchHeight / 2).stroke();

      // Show winner if match is completed
      if (match.winnerId) {
        const winnerPlayer = match.players.find(p => 
          p.playerId.toString() === match.winnerId.toString()
        );
        if (winnerPlayer) {
          const winnerY = winnerPlayer === match.players[0] ? y + 10 : y + 35;
          doc.fontSize(10).font('Helvetica-Bold').text('✓', currentX + columnWidth - 35, winnerY);
        }
      }
    });

    currentX += columnWidth;
  });

  // Add footer
  doc.fontSize(8).font('Helvetica').text(
    `Generated on ${new Date().toLocaleString()}`,
    50,
    doc.page.height - 50,
    { align: 'center' }
  );

  return doc;
};

/**
 * Helper function to format date
 * @param {Date} date - Date object
 * @returns {string} - Formatted date string
 */
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

module.exports = {
  generateTournamentPDF,
  generateBracketPDF
};
