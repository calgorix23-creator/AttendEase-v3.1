// tailwind.config.js
module.exports = {
 content: [
 './dist/**/*.html',
 './index.html',
 './src/**/*.{ts,tsx}',
 './components/**/*.{ts,tsx}',
 './services/**/*.{ts,tsx}',
 './*.tsx',
 './*.ts',
 ],
 theme: { 
 extend: {},
 },
 plugins: [],
}

//module.exports = {
// content: [
// './dist/index.html', // Add all HTML/JS/TS files that use Tailwind classes
// './src/*/.{js,ts,jsx,tsx,html}' // Uncomment if you use a src folder
// ],
// theme: {
// extend: {},
// },
// plugins: [],
//}