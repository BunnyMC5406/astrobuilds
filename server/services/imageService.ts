import sharp from 'sharp';

export async function addWatermark(imageBuffer: Buffer): Promise<Buffer> {
  try {
    const width = 800; // Max width for preview images

    // Create a white semi-transparent text overlay
    const watermarkSvg = Buffer.from(`
      <svg width="800" height="100">
        <style>
          .text {
            fill: rgba(255, 255, 255, 0.5);
            font-size: 24px;
            font-family: Arial, sans-serif;
            transform: rotate(-45deg);
          }
        </style>
        <text x="50%" y="50%" text-anchor="middle" class="text">
          © Minecraft Build Showcase
        </text>
      </svg>
    `);

    // Process the image
    const processedImage = await sharp(imageBuffer)
      .resize(width, null, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .composite([
        {
          input: watermarkSvg,
          tile: true,
          gravity: 'center'
        }
      ])
      .jpeg({ quality: 85 })
      .toBuffer();

    return processedImage;
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image');
  }
}