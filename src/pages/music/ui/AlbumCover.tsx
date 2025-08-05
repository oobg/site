import React from "react";

export const AlbumCover: React.FC = () => {
    return (
        <div className="w-48 h-48 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg shadow-2xl flex items-center justify-center">
            <div className="text-center text-white">
                <div className="text-4xl font-bold mb-2">윤하</div>
                <div className="text-sm opacity-80">고백하기 좋은 날</div>
            </div>
        </div>
    );
}; 