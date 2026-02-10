"use client";

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  size?: 'default' | 'narrow';
}

export default function Modal({ children, onClose, size = 'default' }: ModalProps) {
  const modalStyles = {
    default: { width: "720px" },
    narrow: { width: "620px", height: "600px" }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div 
        className="relative bg-[#1A1B1F] rounded-2xl p-6 border border-[#2a2a2a]" 
        style={modalStyles[size]}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-6 text-gray-400 hover:text-white"
        >
          ✕
        </button>

        {children}
      </div>
    </div>
  );
}
