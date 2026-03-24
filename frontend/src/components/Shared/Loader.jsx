import React from 'react';
import { Bus } from 'lucide-react';

const Loader = ({ fullPage = false }) => {
  const loaderContent = (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Bus Icon Moving Animation */}
      <div className="relative">
        <div className="animate-bounce">
          <Bus size={48} className="text-blue-600" />
        </div>
        {/* Road line effect */}
        <div className="w-12 h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
          <div className="w-full h-full bg-blue-600 animate-[progress_1s_infinite]"></div>
        </div>
      </div>
      <p className="text-slate-500 font-medium animate-pulse text-sm">
        Fetching live data...
      </p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {loaderContent}
      </div>
    );
  }

  return <div className="p-10 flex justify-center">{loaderContent}</div>;
};

export default Loader;