const Jimp = require('jimp');

async function createAdaptive() {
  try {
    const icon = await Jimp.read('assets/images/icon.png');
    // Scale down to 66% (676px) of the adaptive icon size (1024px)
    icon.resize(676, 676); 
    
    // Create a 1024x1024 transparent background
    const bg = new Jimp(1024, 1024, 0x00000000); 
    
    // Composite the icon onto the center
    bg.composite(icon, (1024 - 676) / 2, (1024 - 676) / 2);
    
    await bg.writeAsync('assets/images/adaptive-icon.png');
    console.log('Successfully generated adaptive-icon.png');
  } catch (error) {
    console.error('Error generating adaptive icon:', error);
  }
}

createAdaptive();
