const fs = require('fs');
const { createCanvas } = require('canvas');

const types = ['tree', 'roof', 'power', 'flood', 'window'];
const colors = {
  low: '#4CAF50',    // Green
  medium: '#FFC107', // Yellow
  high: '#F44336'    // Red
};

function drawIcon(type, color) {
  const canvas = createCanvas(32, 32);
  const ctx = canvas.getContext('2d');

  // Draw background circle
  ctx.beginPath();
  ctx.arc(16, 16, 14, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // Draw white border
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw icon based on type
  ctx.fillStyle = 'white';
  switch (type) {
    case 'tree':
      // Tree icon
      ctx.beginPath();
      ctx.moveTo(16, 8);
      ctx.lineTo(8, 24);
      ctx.lineTo(24, 24);
      ctx.closePath();
      ctx.fill();
      break;
    case 'roof':
      // Roof icon
      ctx.beginPath();
      ctx.moveTo(8, 20);
      ctx.lineTo(16, 12);
      ctx.lineTo(24, 20);
      ctx.closePath();
      ctx.fill();
      break;
    case 'power':
      // Lightning bolt icon
      ctx.beginPath();
      ctx.moveTo(16, 8);
      ctx.lineTo(12, 16);
      ctx.lineTo(16, 16);
      ctx.lineTo(12, 24);
      ctx.lineTo(20, 12);
      ctx.lineTo(16, 12);
      ctx.closePath();
      ctx.fill();
      break;
    case 'flood':
      // Water waves icon
      ctx.beginPath();
      ctx.moveTo(8, 20);
      ctx.bezierCurveTo(12, 16, 20, 16, 24, 20);
      ctx.bezierCurveTo(20, 24, 12, 24, 8, 20);
      ctx.fill();
      break;
    case 'window':
      // Window icon
      ctx.fillRect(10, 10, 12, 12);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(16, 10);
      ctx.lineTo(16, 22);
      ctx.moveTo(10, 16);
      ctx.lineTo(22, 16);
      ctx.stroke();
      break;
    default:
      // Default marker icon
      ctx.beginPath();
      ctx.moveTo(16, 8);
      ctx.lineTo(8, 24);
      ctx.lineTo(24, 24);
      ctx.closePath();
      ctx.fill();
  }

  return canvas.toBuffer();
}

// Create icons directory if it doesn't exist
if (!fs.existsSync('public/icons')) {
  fs.mkdirSync('public/icons');
}

// Generate icons for each type and severity
types.forEach(type => {
  Object.entries(colors).forEach(([severity, color]) => {
    const icon = drawIcon(type, color);
    fs.writeFileSync(`public/icons/${type}-${severity}.png`, icon);
  });
}); 