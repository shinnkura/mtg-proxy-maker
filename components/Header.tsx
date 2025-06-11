import { Car as Card, Gamepad2, Sparkles, Zap, Crown, Shield, Sword, Star, Diamond, Gem, Trophy, Target, Flame, Bolt, Wand2, Hexagon, Circle, Square, Triangle, Heart, Spade, Club, FileImage, Image, Printer, Download, Upload, Settings, Palette, Brush, Layers, Grid3x3, Layout, Book, BookOpen, Scroll, Archive, Package, Box, Cuboid as Cube, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const iconOptions = [
  { name: "Card (現在)", icon: Card, color: "from-blue-600 to-purple-600" },
  { name: "Gamepad", icon: Gamepad2, color: "from-green-600 to-blue-600" },
  { name: "Sparkles", icon: Sparkles, color: "from-yellow-500 to-pink-500" },
  { name: "Zap", icon: Zap, color: "from-yellow-600 to-orange-600" },
  { name: "Crown", icon: Crown, color: "from-yellow-500 to-yellow-700" },
  { name: "Shield", icon: Shield, color: "from-blue-700 to-indigo-700" },
  { name: "Sword", icon: Sword, color: "from-gray-600 to-gray-800" },
  { name: "Star", icon: Star, color: "from-yellow-400 to-yellow-600" },
  { name: "Diamond", icon: Diamond, color: "from-cyan-400 to-blue-500" },
  { name: "Gem", icon: Gem, color: "from-purple-500 to-pink-500" },
  { name: "Trophy", icon: Trophy, color: "from-yellow-500 to-orange-500" },
  { name: "Target", icon: Target, color: "from-red-500 to-red-700" },
  { name: "Flame", icon: Flame, color: "from-orange-500 to-red-500" },
  { name: "Bolt", icon: Bolt, color: "from-blue-500 to-purple-500" },
  { name: "Wand", icon: Wand2, color: "from-purple-600 to-pink-600" },
  { name: "Hexagon", icon: Hexagon, color: "from-teal-500 to-cyan-500" },
  { name: "Circle", icon: Circle, color: "from-indigo-500 to-purple-500" },
  { name: "Square", icon: Square, color: "from-gray-500 to-gray-700" },
  { name: "Triangle", icon: Triangle, color: "from-green-500 to-teal-500" },
  { name: "Heart", icon: Heart, color: "from-red-400 to-pink-500" },
  { name: "Spade", icon: Spade, color: "from-gray-700 to-black" },
  { name: "Club", icon: Club, color: "from-green-700 to-green-900" },
  { name: "FileImage", icon: FileImage, color: "from-blue-500 to-indigo-500" },
  { name: "Image", icon: Image, color: "from-green-500 to-blue-500" },
  { name: "Printer", icon: Printer, color: "from-gray-600 to-gray-800" },
  { name: "Download", icon: Download, color: "from-green-600 to-green-800" },
  { name: "Upload", icon: Upload, color: "from-blue-600 to-blue-800" },
  { name: "Settings", icon: Settings, color: "from-gray-500 to-gray-700" },
  { name: "Palette", icon: Palette, color: "from-pink-500 to-purple-500" },
  { name: "Brush", icon: Brush, color: "from-orange-500 to-red-500" },
  { name: "Layers", icon: Layers, color: "from-indigo-500 to-blue-500" },
  { name: "Grid", icon: Grid3x3, color: "from-gray-600 to-gray-800" },
  { name: "Layout", icon: Layout, color: "from-blue-500 to-purple-500" },
  { name: "Book", icon: Book, color: "from-brown-600 to-brown-800" },
  { name: "BookOpen", icon: BookOpen, color: "from-amber-600 to-orange-600" },
  { name: "Scroll", icon: Scroll, color: "from-yellow-700 to-amber-700" },
  { name: "Archive", icon: Archive, color: "from-gray-600 to-gray-800" },
  { name: "Package", icon: Package, color: "from-brown-500 to-brown-700" },
  { name: "Box", icon: Box, color: "from-orange-600 to-red-600" },
  { name: "Cube", icon: Cube, color: "from-purple-600 to-indigo-600" },
  { name: "Dice1", icon: Dice1, color: "from-red-500 to-red-700" },
  { name: "Dice2", icon: Dice2, color: "from-blue-500 to-blue-700" },
  { name: "Dice3", icon: Dice3, color: "from-green-500 to-green-700" },
  { name: "Dice4", icon: Dice4, color: "from-yellow-500 to-yellow-700" },
  { name: "Dice5", icon: Dice5, color: "from-purple-500 to-purple-700" },
  { name: "Dice6", icon: Dice6, color: "from-pink-500 to-pink-700" },
];

interface HeaderProps {
  onPdfGenerate?: () => void;
  isPdfDisabled?: boolean;
}

export default function Header({ onPdfGenerate, isPdfDisabled = false }: HeaderProps) {
  const [selectedIcon, setSelectedIcon] = useState(iconOptions[0]);
  const [showIconSelector, setShowIconSelector] = useState(false);

  const SelectedIconComponent = selectedIcon.icon;

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200 backdrop-blur-sm bg-white/95">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div 
              className={`bg-gradient-to-br ${selectedIcon.color} p-1.5 sm:p-2 rounded-lg cursor-pointer hover:scale-105 transition-transform flex-shrink-0`}
              onClick={() => setShowIconSelector(!showIconSelector)}
              title="アイコンを変更"
            >
              <SelectedIconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 truncate">
                MTG プロキシメーカー
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                Magic: The Gathering カード印刷ツール
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={onPdfGenerate}
              disabled={isPdfDisabled}
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-2 sm:px-3"
            >
              <FileImage className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">PDFで表示</span>
              <span className="sm:hidden">PDF</span>
            </Button>
          </div>
        </div>

        {/* アイコン選択パネル */}
        {showIconSelector && (
          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg border">
            <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">アイコンを選択:</h3>
            <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-14 xl:grid-cols-16 gap-1.5 sm:gap-2">
              {iconOptions.map((option, index) => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedIcon(option);
                      setShowIconSelector(false);
                    }}
                    className={`p-1.5 sm:p-2 rounded-lg transition-all hover:scale-110 ${
                      selectedIcon.name === option.name 
                        ? 'ring-1 sm:ring-2 ring-blue-500 ring-offset-1 sm:ring-offset-2' 
                        : 'hover:bg-white hover:shadow-md'
                    }`}
                    title={option.name}
                  >
                    <div className={`bg-gradient-to-br ${option.color} p-1 sm:p-1.5 rounded`}>
                      <IconComponent className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 sm:mt-3 flex justify-between items-center">
              <p className="text-xs text-gray-500">
                現在選択中: {selectedIcon.name}
              </p>
              <button
                onClick={() => setShowIconSelector(false)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                閉じる
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}