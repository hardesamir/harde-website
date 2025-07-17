const fs = require('fs');
const path = require('path');

module.exports = function(eleventyConfig) {
  // Copy images to output folder
  eleventyConfig.addPassthroughCopy({ "images": "images" });

  // Gallery images collection
  eleventyConfig.addCollection("galleryImages", function() {
    const galleryDir = path.join(__dirname, "images", "gallery");
    return fs.readdirSync(galleryDir)
      .filter(file => /\.(jpe?g|png|gif|webp)$/i.test(file))
      .map(file => ({
        url: `/images/gallery/${file}`,
        fileSlug: path.parse(file).name
      }));
  });

  // Hero images collection
  eleventyConfig.addCollection("heroImages", function() {
    const heroDir = path.join(__dirname, "images", "hero");
    console.log('DEBUG: heroDir =', heroDir);
    if (!fs.existsSync(heroDir)) {
      console.log('ERROR: Hero images directory does not exist:', heroDir);
      return [];
    }
    return fs.readdirSync(heroDir)
      .filter(file => /\.(jpe?g|png|gif|webp)$/i.test(file))
      .map(file => ({
        url: `/images/hero/${file}`,
        fileSlug: path.parse(file).name
      }));
  });
};
