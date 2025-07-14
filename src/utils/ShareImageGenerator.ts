import type { NameResult } from '../types';
import type { SharePlatform } from '../types/sharing';
import { getDimensions } from '../templates/imageTemplates';
import { createElementLayout, getElementDisplayProperties, calculateImageLayout } from './elementRenderer';
import { defaultColorScheme } from './colorSchemes';

export class ShareImageGenerator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }
  
  // Generate X image (1200x675)
  async generateXImage(result: NameResult): Promise<Blob> {
    const dimensions = getDimensions('x');
    this.canvas.width = dimensions.width;
    this.canvas.height = dimensions.height;
    return this.renderDesign(result, 'x');
  }
  
  // Generate Instagram image (1080x1080)
  async generateInstagramImage(result: NameResult): Promise<Blob> {
    const dimensions = getDimensions('instagram');
    this.canvas.width = dimensions.width;
    this.canvas.height = dimensions.height;
    return this.renderDesign(result, 'instagram');
  }
  
  private async renderDesign(result: NameResult, platform: SharePlatform): Promise<Blob> {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw background - same as website (bg-gray-50)
    this.drawBackground();
    
    // Create element layout using shared utility
    const layout = createElementLayout(result);
    
    // Draw elements as tiles
    this.drawElementTiles(layout, platform);
    
    // Draw branding
    this.drawBranding();
    
    // Convert to blob
    return new Promise((resolve) => {
      this.canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/png', 0.9);
    });
  }
  
  private drawBackground(): void {
    // Use the same gray background as the website (bg-gray-50)
    this.ctx.fillStyle = defaultColorScheme.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  private drawElementTiles(layout: any, platform: SharePlatform): void {
    const { width, height } = this.canvas;
    
    // Get layout dimensions using shared utility
    const layoutInfo = calculateImageLayout(layout, platform);
    
    // Calculate positioning
    let startX = (width - layoutInfo.totalWidth) / 2;
    let startY = (height - layoutInfo.totalHeight) / 2;
    
    // Track position for elements (including spaces)
    let currentX = startX;
    let currentY = startY;
    let elementsInCurrentRow = 0;
    
    layout.items.forEach((item: any) => {
      if (item.type === 'space') {
        // For spaces, just move the cursor position
        currentX += 16; // Space width (w-4 = 16px)
        return;
      }
      
      // Check if we need to wrap to next row
      if (elementsInCurrentRow >= layoutInfo.maxElementsPerRow) {
        currentX = startX;
        currentY += layoutInfo.tileSize + layoutInfo.spacing;
        elementsInCurrentRow = 0;
      }
      
      // Draw the element
      this.drawElementTile(item, currentX, currentY, layoutInfo.tileSize);
      
      // Move to next position
      currentX += layoutInfo.tileSize + layoutInfo.spacing;
      elementsInCurrentRow++;
    });
  }
  
  private drawElementTile(item: any, x: number, y: number, size: number): void {
    const displayProps = getElementDisplayProperties(item);
    if (!displayProps || displayProps.isSpace) return;
    
    const cornerRadius = size * 0.125; // 12.5% of tile size for rounded corners
    
    // Draw rounded rectangle background
    this.drawRoundedRect(x, y, size, size, cornerRadius, displayProps.backgroundColor);
    
    // Draw border
    this.ctx.strokeStyle = displayProps.borderColor;
    this.ctx.lineWidth = 2;
    
    if (!displayProps.isFake) {
      // Solid border for real elements
      this.ctx.setLineDash([]);
    } else {
      // Dashed border for fake elements
      this.ctx.setLineDash([4, 4]);
    }
    
    this.ctx.stroke();
    this.ctx.setLineDash([]); // Reset line dash
    
    // Draw atomic number (top left)
    if (displayProps.atomicNumber) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      this.ctx.font = `bold ${size * 0.15}px Inter, sans-serif`;
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'top';
      this.ctx.fillText(displayProps.atomicNumber.toString(), x + 4, y + 2);
    }
    
    // Draw element symbol (center)
    this.ctx.fillStyle = 'white';
    this.ctx.font = `bold ${size * 0.4}px Inter, sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(displayProps.symbol, x + size / 2, y + size / 2);
    
    // Draw element name (bottom)
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.font = `${size * 0.12}px Inter, sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'bottom';
    
    // Truncate long names
    const maxWidth = size - 8;
    let name = displayProps.name;
    while (this.ctx.measureText(name).width > maxWidth && name.length > 0) {
      name = name.slice(0, -1);
    }
    if (name.length < displayProps.name.length) {
      name = name.slice(0, -1) + '…';
    }
    
    this.ctx.fillText(name, x + size / 2, y + size - 4);
  }
  
  private drawRoundedRect(x: number, y: number, width: number, height: number, radius: number, fillColor: string): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
    
    this.ctx.fillStyle = fillColor;
    this.ctx.fill();
  }
  
  private drawBranding(): void {
    const { width, height } = this.canvas;
    
    // Draw website URL
    this.ctx.fillStyle = 'rgba(107, 114, 128, 0.8)'; // gray-500 with opacity
    this.ctx.font = 'bold 16px Inter, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'bottom';
    
    const url = 'periodicnames.com';
    this.ctx.fillText(url, width / 2, height - 20);
  }
  
  // Download image with given filename
  downloadImage(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
} 