# Daily Dua – Hizbul Azam

A modern, responsive web application that brings daily Islamic supplications (duas) from the Hizb collection to your fingertips. Built with React and TypeScript, this app helps you engage with authentic, graded duas for each day of the week.

---

## Features

✨ **Daily Duas**  
Access a curated collection of authentic Islamic supplications organized by day of the week (starting with Friday).

🌍 **Multi-Language Support**  
Read duas and translations in English, German, and French. Switch languages seamlessly with a single click.

📱 **Touch-Friendly Navigation**  
- **Swipe left/right** to navigate between days
- **Pinch to zoom** Arabic text for comfortable reading at any size

❤️ **Favorites System**  
Bookmark your favorite duas and easily access them later. All favorites are saved locally in your browser.

🎨 **Light & Dark Mode**  
Choose between light and dark themes for comfortable reading at any time of day.

⚙️ **Customizable Settings**  
- Adjust Arabic font size for optimal readability
- Toggle translations on/off
- Customize which features you want to use

📖 **Authenticated Sources**  
Each dua includes:
- Original Arabic text with diacritical marks
- Source context and references
- Grading information from Islamic scholars
- Primary source citations (Qur'an, Sahih collections, etc.)

🔍 **Source Transparency**  
View scholarly gradings (Sahih, Hasan, Dhaif) and understand the authenticity level of each supplication.

---

## Getting Started

### Prerequisites
- Node.js (v16 or later)
- npm or yarn

### Installation

1. **Clone the repository:**
```bash
git clone git@github.com:fecbatino/hizbulazam.git
cd hizbulazam
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the development server:**
```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173` (or the URL shown in your terminal).

### Build for Production

```bash
npm run build
```

The optimized build will be generated in the `dist/` folder.

### Preview Production Build

```bash
npm preview
```

---

## Project Structure

```
hizbulazam/
├── components/           # React components (UI elements, modals, selectors)
├── hooks/               # Custom React hooks (duas data, touch gestures)
├── App.tsx             # Main application component
├── types.ts            # TypeScript interfaces and types
├── constants.ts        # Application constants (day order mapping, etc.)
├── vite.config.ts      # Vite configuration
├── index.html          # HTML entry point
├── tsconfig.json       # TypeScript configuration
├── package.json        # Dependencies and scripts
└── README.md           # This file
```

### Key Files

- **`hooks/duas.ts`** – Contains all dua data and collections
- **`components/DuaCard.tsx`** – Main display component for duas
- **`components/DayNavigator.tsx`** – Day navigation controls
- **`components/LanguageSelector.tsx`** – Language switcher
- **`hooks/useSwipe.ts`** – Touch gesture handling (swipe detection)

---

## Technologies

- **React 19** – UI library
- **TypeScript** – Type-safe development
- **Vite** – Fast build tool and dev server
- **Tailwind CSS** – Utility-first styling
- **Amiri Font** – Beautiful Arabic typography

---

## Usage

### Navigation
- **Click day name** to open day selector modal
- **Arrow buttons** to move to previous/next day
- **Swipe** on touch devices

### Customize Your Experience
1. Click the **⚙️ Settings icon** to open settings
2. Adjust Arabic font size using the slider
3. Toggle translations on/off
4. Customize visibility of favorites and sharing options

### Favorites
- Click the **❤️ heart icon** on any dua to add it to favorites
- Favorites are automatically saved to your browser's local storage
- Clear browser storage to reset favorites

### Theme
- Click the **☀️/🌙 icon** to toggle between light and dark mode
- Your theme preference is saved automatically

---

## Browser Compatibility

This app works best on:
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile devices (iOS 13+, Android 8+)
- Desktop browsers with touch support

**Local Storage:** The app uses browser local storage to save favorites, settings, and theme preference. Make sure cookies/storage are enabled.

---

## Data Structure

Each dua includes:
- **Arabic text** with full diacriticals
- **Translations** in multiple languages
- **Source context** explaining the background
- **Authenticity grading** (Sahih, Hasan, Dhaif, etc.)
- **Primary sources** (Qur'an references, Hadith collections)

---

## Performance Features

- ⚡ Optimized React rendering with memoization
- 📦 Vite's fast build system
- 🎯 Lazy component loading
- 💾 Efficient local storage management
- 📱 Touch-optimized with smooth gestures

---

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard-navigable interface
- Readable font sizes
- High contrast in both light and dark modes

---

## Future Enhancements

Potential features for future releases:
- Offline support with service workers
- Daily push notifications
- Sharing duas on social media
- Search and filter functionality
- Additional language translations
- Audio recitations

---

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a pull request

---

## License

This project is licensed under the MIT License – see the `LICENSE` file for details.

---

## Support & Acknowledgments

**About the Hizb Collection:**  
The Hizb collection is a comprehensive set of authentic Islamic supplications organized by day of the week, designed to help Muslims deepen their spiritual practice.

**Sources:**  
All duas are sourced from authentic Islamic texts and are graded according to scholarly consensus.

---

## Contact

For questions, suggestions, or feedback:
- Open an issue on GitHub
- Connect via the repository

---

## Disclaimer

This application is provided for educational and spiritual purposes. Always consult with Islamic scholars for religious guidance and verification of hadith authenticity.
