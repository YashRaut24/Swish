import React from 'react';
import { Plus } from 'lucide-react';

const FloatingActionButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-500 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 flex items-center justify-center md:hidden z-40 group"
      aria-label="Create post"
    >
      <Plus size={28} className="group-hover:rotate-90 transition-transform" />
    </button>
  );
};

export default FloatingActionButton;