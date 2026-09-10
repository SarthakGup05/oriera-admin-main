import React from "react";

const Loader = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm z-50">
      <div className="w-16 h-16 border-4 border-transparent border-t-[#6C63FF] border-r-[#6C63FF] rounded-full animate-spin shadow-lg"></div>
    </div>
  );
};

export default Loader;
