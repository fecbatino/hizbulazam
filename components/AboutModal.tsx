import React from 'react';
import { Language } from '../types';

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
    language: Language;
}

const translations = {
    en: {
        title: "About Daily Dua",
        description: "A modern, offline-first application for daily supplications (Duas). It provides daily prayers from Saturday to Friday in multiple languages with a clean, minimalist, and user-friendly interface.",
        howToTitle: "How to Use the App",
        usagePoints: [
            '<strong>Navigation:</strong> Swipe left or right to switch between days.',
            "<strong>Day Selection:</strong> Tap the day's name (e.g., 'Friday') to jump directly to a specific day.",
            '<strong>Zoom:</strong> Use the "pinch-to-zoom" gesture to quickly adjust the Arabic font size.',
            '<strong>Settings:</strong> Click the gear icon (⚙️) to adjust font size or toggle the favorite and share buttons.',
            '<strong>Translation:</strong> Toggle the translation on or off with the eye icon (👁️).',
            '<strong>Theme:</strong> Switch between light and dark themes with the sun/moon icon (☀️/🌙).',
        ],
        close: "Close",
    },
    de: {
        title: "Über Daily Dua",
        description: "Eine moderne Offline-Anwendung für tägliche Bittgebete (Duas). Sie bietet tägliche Gebete von Samstag bis Freitag in mehreren Sprachen mit einer sauberen, minimalistischen und benutzerfreundlichen Oberfläche.",
        howToTitle: "So benutzt du die App",
        usagePoints: [
            '<strong>Navigation:</strong> Wische nach links oder rechts, um zwischen den Tagen zu wechseln.',
            '<strong>Tagesauswahl:</strong> Tippe auf den Namen des Tages (z.B. "Freitag"), um direkt zu einem bestimmten Tag zu springen.',
            '<strong>Zoomen:</strong> Nutze die "Pinch-to-Zoom"-Geste (zwei Finger), um die arabische Schriftgröße schnell anzupassen.',
            '<strong>Einstellungen:</strong> Klicke auf das Zahnrad-Symbol (⚙️), um die Schriftgröße anzupassen oder die Favoriten- und Teilen-Buttons ein- und auszublenden.',
            '<strong>Übersetzung:</strong> Schalte die Übersetzung mit dem Augen-Symbol (👁️) ein oder aus.',
            '<strong>Design:</strong> Wechsle zwischen hellem und dunklem Design mit dem Sonnen-/Mond-Symbol (☀️/🌙).',
        ],
        close: "Schließen",
    },
    fr: {
        title: "À propos de Daily Dua",
        description: "Une application moderne, fonctionnant hors ligne, pour les supplications quotidiennes (Duas). Elle propose des prières quotidiennes du samedi au vendredi en plusieurs langues avec une interface épurée, minimaliste et conviviale.",
        howToTitle: "Comment utiliser l'application",
        usagePoints: [
            "<strong>Navigation :</strong> Balayez vers la gauche ou la droite pour passer d'un jour à l'autre.",
            "<strong>Sélection du jour :</strong> Appuyez sur le nom du jour (par ex. 'Vendredi') pour accéder directement à un jour spécifique.",
            "<strong>Zoom :</strong> Utilisez le geste de pincer pour zoomer afin d'ajuster rapidement la taille de la police arabe.",
            "<strong>Paramètres :</strong> Cliquez sur l'icône d'engrenage (⚙️) pour ajuster la taille de la police ou afficher/masquer les boutons de favoris et de partage.",
            "<strong>Traduction :</strong> Activez ou désactivez la traduction avec l'icône de l'œil (👁️).",
            "<strong>Thème :</strong> Basculez entre les thèmes clair et sombre avec l'icône soleil/lune (☀️/🌙).",
        ],
        close: "Fermer",
    },
    ar: {
        title: "حول Daily Dua",
        description: "تطبيق حديث يعمل دون اتصال بالإنترنت للأدعية اليومية. يقدم أدعية يومية من السبت إلى الجمعة بلغات متعددة بواجهة نظيفة وبسيطة وسهلة الاستخدام.",
        howToTitle: "كيفية استخدام التطبيق",
        usagePoints: [
            '<strong>التنقل:</strong> اسحب لليسار أو لليمين للتنقل بين الأيام.',
            '<strong>اختيار اليوم:</strong> اضغط على اسم اليوم (مثل "الجمعة") للانتقال مباشرة إلى يوم محدد.',
            '<strong>التكبير:</strong> استخدم إيماءة "القرص للتكبير" بإصبعين لضبط حجم الخط العربي.',
            '<strong>الإعدادات:</strong> انقر على أيقونة الترس (⚙️) لضبط حجم الخط أو إظهار/إخفاء أزرار المفضلة والمشاركة.',
            '<strong>المظهر:</strong> التبديل بين المظهر الفاتح والداكن بأيقونة الشمس/القمر (☀️/🌙).',
        ],
        close: "إغلاق",
    },
};

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, language }) => {
    if (!isOpen) {
        return null;
    }

    const t = translations[language] || translations.en;

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300" 
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-title"
        >
            <div 
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-md text-left overflow-y-auto max-h-[90vh]" 
                onClick={(e) => e.stopPropagation()}
            >
                <h3 id="about-title" className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100 text-center">
                    {t.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed text-center">
                    {t.description}
                </p>

                <hr className="border-slate-200 dark:border-slate-700 my-6" />

                <h4 className="font-bold text-md mb-3 text-slate-800 dark:text-slate-100 text-center">
                    {t.howToTitle}
                </h4>
                <ul className="space-y-3 text-slate-600 dark:text-slate-300 text-sm list-disc list-inside">
                     {t.usagePoints.map((point, index) => (
                        <li key={index} dangerouslySetInnerHTML={{ __html: point }} />
                    ))}
                </ul>

                <div className="text-center mt-8">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-teal-500 text-white rounded-lg font-semibold hover:bg-teal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500 dark:focus-visible:ring-offset-slate-800 transition-colors"
                    >
                        {t.close}
                    </button>
                </div>
            </div>
        </div>
    );
};