const fs = require('fs');
const path = require('path');

module.exports = function(eleventyConfig) {
  // Copy static files
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("styles.css");
  eleventyConfig.addPassthroughCopy("CNAME");
  
  // Create gallery images collection
  eleventyConfig.addCollection("galleryImages", function(collectionApi) {
    const galleryPath = './images/gallery';
    const images = [];
    
    try {
      if (fs.existsSync(galleryPath)) {
        const files = fs.readdirSync(galleryPath);
        files.forEach(file => {
          if (file.match(/\.(jpg|jpeg|png|gif|webp)$/i) && file !== '.keep') {
            images.push({
              url: `/images/gallery/${file}`,
              fileSlug: path.parse(file).name,
              filename: file
            });
          }
        });
      }
    } catch (error) {
      console.log('Gallery directory not found or error reading:', error.message);
    }
    
    return images.sort((a, b) => a.filename.localeCompare(b.filename));
  });

  // Create hero images collection
  eleventyConfig.addCollection("heroImages", function(collectionApi) {
    const heroPath = './images/hero';
    const images = [];
    
    try {
      if (fs.existsSync(heroPath)) {
        const files = fs.readdirSync(heroPath);
        files.forEach(file => {
          if (file.match(/\.(jpg|jpeg|png|gif|webp)$/i) && file !== '.keep') {
            images.push({
              url: `/images/hero/${file}`,
              fileSlug: path.parse(file).name,
              filename: file
            });
          }
        });
      }
    } catch (error) {
      console.log('Hero directory not found or error reading:', error.message);
    }
    
    return images.sort((a, b) => a.filename.localeCompare(b.filename));
  });
  
  // Set up directories
  return {
    dir: {
      input: ".",
      includes: "_includes",
      output: "_site"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
}; 