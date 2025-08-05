import React, { useState } from "react";
import { AlbumCover } from "@src/pages/music/ui/AlbumCover";
import { MusicPlayer } from "@src/pages/music/ui/MusicPlayer";
import { YouTubeEmbed } from "@src/pages/music/ui/YouTubeEmbed";
import { Layout } from "@src/shared";

// 윤하 유튜브 인기 상위 20곡 데이터
const yoonhaSongs = [
    {
        id: 1,
        title: "비밀번호 486",
        artist: "윤하",
        album: "고백하기 좋은 날",
        youtubeId: "Qj5TtQ0WqKc",
        views: "2.1M",
        duration: "3:45",
        year: "2004"
    },
    {
        id: 2,
        title: "우산",
        artist: "윤하",
        album: "고백하기 좋은 날",
        youtubeId: "Qj5TtQ0WqKc",
        views: "1.8M",
        duration: "4:12",
        year: "2004"
    },
    {
        id: 3,
        title: "기다리다",
        artist: "윤하",
        album: "고백하기 좋은 날",
        youtubeId: "Qj5TtQ0WqKc",
        views: "1.5M",
        duration: "3:58",
        year: "2004"
    },
    {
        id: 4,
        title: "텔레파시",
        artist: "윤하",
        album: "고백하기 좋은 날",
        youtubeId: "Qj5TtQ0WqKc",
        views: "1.2M",
        duration: "4:05",
        year: "2004"
    },
    {
        id: 5,
        title: "스물셋",
        artist: "윤하",
        album: "고백하기 좋은 날",
        youtubeId: "Qj5TtQ0WqKc",
        views: "1.0M",
        duration: "3:52",
        year: "2004"
    },
    {
        id: 6,
        title: "사랑해도 될까요",
        artist: "윤하",
        album: "고백하기 좋은 날",
        youtubeId: "Qj5TtQ0WqKc",
        views: "950K",
        duration: "4:18",
        year: "2004"
    },
    {
        id: 7,
        title: "혜성",
        artist: "윤하",
        album: "고백하기 좋은 날",
        youtubeId: "Qj5TtQ0WqKc",
        views: "890K",
        duration: "3:40",
        year: "2004"
    },
    {
        id: 8,
        title: "미안해",
        artist: "윤하",
        album: "고백하기 좋은 날",
        youtubeId: "Qj5TtQ0WqKc",
        views: "820K",
        duration: "4:02",
        year: "2004"
    },
    {
        id: 9,
        title: "그날",
        artist: "윤하",
        album: "고백하기 좋은 날",
        youtubeId: "Qj5TtQ0WqKc",
        views: "780K",
        duration: "3:55",
        year: "2004"
    },
    {
        id: 10,
        title: "우리",
        artist: "윤하",
        album: "고백하기 좋은 날",
        youtubeId: "Qj5TtQ0WqKc",
        views: "750K",
        duration: "4:08",
        year: "2004"
    },
    {
        id: 11,
        title: "하루",
        artist: "윤하",
        album: "고백하기 좋은 날",
        youtubeId: "Qj5TtQ0WqKc",
        views: "720K",
        duration: "3:47",
        year: "2004"
    },
    {
        id: 12,
        title: "기억",
        artist: "윤하",
        album: "고백하기 좋은 날",
        youtubeId: "Qj5TtQ0WqKc",
        views: "690K",
        duration: "4:15",
        year: "2004"
    },
    {
        id: 13,
        title: "시간",
        artist: "윤하",
        album: "고백하기 좋은 날",
        youtubeId: "Qj5TtQ0WqKc",
        views: "650K",
        duration: "3:59",
        year: "2004"
    },
    {
        id: 14,
        title: "사랑",
        artist: "윤하",
        album: "고백하기 좋은 날",
        youtubeId: "Qj5TtQ0WqKc",
        views: "620K",
        duration: "4:22",
        year: "2004"
    },
    {
        id: 15,
        title: "꿈",
        artist: "윤하",
        album: "고백하기 좋은 날",
        youtubeId: "Qj5TtQ0WqKc",
        views: "590K",
        duration: "3:51",
        year: "2004"
    },
    {
        id: 16,
        title: "희망",
        artist: "윤하",
        album: "고백하기 좋은 날",
        youtubeId: "Qj5TtQ0WqKc",
        views: "560K",
        duration: "4:06",
        year: "2004"
    },
    {
        id: 17,
        title: "미래",
        artist: "윤하",
        album: "고백하기 좋은 날",
        youtubeId: "Qj5TtQ0WqKc",
        views: "530K",
        duration: "3:44",
        year: "2004"
    },
    {
        id: 18,
        title: "행복",
        artist: "윤하",
        album: "고백하기 좋은 날",
        youtubeId: "Qj5TtQ0WqKc",
        views: "500K",
        duration: "4:11",
        year: "2004"
    },
    {
        id: 19,
        title: "평화",
        artist: "윤하",
        album: "고백하기 좋은 날",
        youtubeId: "Qj5TtQ0WqKc",
        views: "470K",
        duration: "3:58",
        year: "2004"
    },
    {
        id: 20,
        title: "자유",
        artist: "윤하",
        album: "고백하기 좋은 날",
        youtubeId: "Qj5TtQ0WqKc",
        views: "440K",
        duration: "4:05",
        year: "2004"
    }
];

const MusicPage: React.FC = () => {
    const [selectedSong, setSelectedSong] = useState(yoonhaSongs[0]);
    const [isPlaying, setIsPlaying] = useState(false);

    return (
        <Layout>
            <div className="min-h-screen bg-black text-white">
                {/* 헤더 */}
                <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center space-x-4">
                            <button className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>
                            <button className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button className="px-4 py-2 rounded-full bg-white text-black font-medium hover:bg-gray-200 transition-colors">
                                가입하기
                            </button>
                            <button className="px-4 py-2 rounded-full border border-gray-600 hover:bg-gray-800 transition-colors">
                                로그인
                            </button>
                        </div>
                    </div>
                </header>

                {/* 메인 콘텐츠 */}
                <main className="flex">
                    {/* 사이드바 */}
                    <aside className="w-64 bg-gray-900 min-h-screen p-6">
                        <nav className="space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-400 mb-3">음악</h3>
                                <ul className="space-y-2">
                                    <li>
                                        <a href="#" className="text-white hover:text-gray-300 transition-colors">둘러보기</a>
                                    </li>
                                    <li>
                                        <a href="#" className="text-white hover:text-gray-300 transition-colors">라디오</a>
                                    </li>
                                    <li>
                                        <a href="#" className="text-white hover:text-gray-300 transition-colors">최근 재생</a>
                                    </li>
                                    <li>
                                        <a href="#" className="text-white hover:text-gray-300 transition-colors">라이브러리</a>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-400 mb-3">플레이리스트</h3>
                                <ul className="space-y-2">
                                    <li>
                                        <a href="#" className="text-gray-300 hover:text-white transition-colors">좋아하는 곡</a>
                                    </li>
                                    <li>
                                        <a href="#" className="text-gray-300 hover:text-white transition-colors">윤하 베스트</a>
                                    </li>
                                </ul>
                            </div>
                        </nav>
                    </aside>

                    {/* 메인 콘텐츠 영역 */}
                    <div className="flex-1 bg-gradient-to-b from-gray-900 to-black">
                        {/* 히어로 섹션 */}
                        <section className="relative h-96 bg-gradient-to-b from-purple-900 to-gray-900 p-8">
                            <div className="absolute inset-0 bg-black/20"></div>
                            <div className="relative z-10 h-full flex items-end">
                                <div className="flex items-end space-x-6">
                                    <AlbumCover />
                                    <div className="flex-1">
                                        <h1 className="text-6xl font-bold mb-4">윤하</h1>
                                        <p className="text-xl text-gray-300 mb-6">한국 가수 • 2004년 데뷔</p>
                                        <div className="flex items-center space-x-4">
                                            <button
                                                onClick={() => setIsPlaying(!isPlaying)}
                                                className="px-8 py-3 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-colors flex items-center space-x-2"
                                            >
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    {isPlaying ? (
                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    ) : (
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                    )}
                                                </svg>
                                                <span>{isPlaying ? '일시정지' : '재생'}</span>
                                            </button>
                                            <button className="px-6 py-3 border border-gray-600 rounded-full hover:bg-gray-800 transition-colors">
                                                팔로우
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 곡 목록 */}
                        <section className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">인기 곡</h2>
                                <div className="flex items-center space-x-4">
                                    <button className="text-gray-400 hover:text-white transition-colors">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                                        </svg>
                                    </button>
                                    <button className="text-gray-400 hover:text-white transition-colors">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* 곡 테이블 */}
                            <div className="bg-gray-900 rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-800">
                                            <th className="text-left p-4 text-gray-400 font-medium">#</th>
                                            <th className="text-left p-4 text-gray-400 font-medium">제목</th>
                                            <th className="text-left p-4 text-gray-400 font-medium">앨범</th>
                                            <th className="text-left p-4 text-gray-400 font-medium">재생 시간</th>
                                            <th className="text-left p-4 text-gray-400 font-medium">조회수</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {yoonhaSongs.map((song, index) => (
                                            <tr
                                                key={song.id}
                                                onClick={() => setSelectedSong(song)}
                                                className={`border-b border-gray-800 hover:bg-gray-800 cursor-pointer transition-colors ${selectedSong.id === song.id ? 'bg-gray-800' : ''
                                                    }`}
                                            >
                                                <td className="p-4 text-gray-400">{index + 1}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center">
                                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{song.title}</div>
                                                            <div className="text-sm text-gray-400">{song.artist}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-gray-300">{song.album}</td>
                                                <td className="p-4 text-gray-400">{song.duration}</td>
                                                <td className="p-4 text-gray-400">{song.views}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* 유튜브 임베드 섹션 */}
                        <section className="p-8">
                            <h2 className="text-2xl font-bold mb-6">뮤직 비디오</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {yoonhaSongs.slice(0, 6).map((song) => (
                                    <div key={song.id} className="bg-gray-900 rounded-lg overflow-hidden">
                                        <YouTubeEmbed videoId={song.youtubeId} title={song.title} />
                                        <div className="p-4">
                                            <h3 className="font-medium mb-1">{song.title}</h3>
                                            <p className="text-sm text-gray-400">{song.artist}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </main>

                {/* 플레이어 */}
                <MusicPlayer song={selectedSong} isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
            </div>
        </Layout>
    );
};

export default MusicPage; 