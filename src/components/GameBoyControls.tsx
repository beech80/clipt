import { Link } from "react-router-dom";

const GameBoyControls = () => {
  return (
    <div className="fixed bottom-20 right-4 z-50 grid grid-cols-2 gap-2 p-4 bg-[#1A1F2C]/80 backdrop-blur-lg rounded-lg border border-gaming-700/50">
      <Link
        to="/"
        className="px-4 py-2 text-gaming-400 hover:bg-gaming-800/50 rounded transition-colors"
      >
        Home
      </Link>
      <Link
        to="/discover"
        className="px-4 py-2 text-gaming-400 hover:bg-gaming-800/50 rounded transition-colors"
      >
        Discover
      </Link>
      <Link
        to="/messages"
        className="px-4 py-2 text-gaming-400 hover:bg-gaming-800/50 rounded transition-colors"
      >
        Messages
      </Link>
      <Link
        to="/profile"
        className="px-4 py-2 text-gaming-400 hover:bg-gaming-800/50 rounded transition-colors"
      >
        Profile
      </Link>
      <Link
        to="/streaming"
        className="px-4 py-2 text-gaming-400 hover:bg-gaming-800/50 rounded transition-colors"
      >
        Streaming
      </Link>
      <Link
        to="/top-clips"
        className="px-4 py-2 text-gaming-400 hover:bg-gaming-800/50 rounded transition-colors"
      >
        Top Clips
      </Link>
      <Link
        to="/clipts"
        className="px-4 py-2 text-gaming-400 hover:bg-gaming-800/50 rounded transition-colors col-span-2"
      >
        Clipts
      </Link>
    </div>
  );
};

export default GameBoyControls;