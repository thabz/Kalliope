import sharp from 'sharp';

const resizeImage = async (inputfile, outputfile, maxWidth, options = {}) => {
  try {
    const resizeOptions = {
      width: maxWidth,
      withoutEnlargement: true,
    };
    if (options.fit != null) {
      const metadata = await sharp(inputfile).metadata();
      const squareSize = Math.min(
        maxWidth,
        metadata.width ?? maxWidth,
        metadata.height ?? maxWidth
      );
      resizeOptions.width = squareSize;
      resizeOptions.height = squareSize;
      resizeOptions.fit = options.fit;
    }
    const image = sharp(inputfile).resize(resizeOptions);
    image.jpeg({ quality: options.quality ?? 82 });
    await image.toFile(outputfile);
    return outputfile;
  } catch (err) {
    console.log(err);
    console.log(outputfile);
    throw err;
  }
};

export { resizeImage };
