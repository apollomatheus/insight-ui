module.exports = {
 fonts: {
   expand: true,
   cwd: 'public/',
   src: ['fonts/**.*'],
   dest: 'dist/',
 },
 img: {
   expand: true,
   cwd: 'public/',
   src: ['img/**.*'],
   dest: 'dist/',
 },
 html: {
    expand: true,
    cwd: 'public/',
    src: ['views/**/*.html', 'index.html'],
    dest: 'dist/',
  }
};