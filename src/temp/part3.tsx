// Main Streaming Page Component
const StreamingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("live");
  const [showChatViewer, setShowChatViewer] = useState(false);
  const [showStreamManager, setShowStreamManager] = useState(false);
  const [showStreamSetup, setShowStreamSetup] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [streamDuration, setStreamDuration] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const [chatCount, setChatCount] = useState(0);
  const [streamLayout, setStreamLayout] = useState("default");
  const [isChatEnabled, setIsChatEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [streamTitle, setStreamTitle] = useState("");
  const [streamCategory, setStreamCategory] = useState("gaming");
  const [streamGame, setStreamGame] = useState("");
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);

  // Function to toggle chat viewer modal with enhanced reliability
  const toggleChatViewer = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setShowChatViewer(!showChatViewer);
    console.log('Chat viewer toggled:', !showChatViewer);
  };

  // Toggle stream manager
  const toggleStreamManager = () => {
    setShowStreamManager(!showStreamManager);
  };

  // Toggle mobile streaming setup dialog
  const toggleStreamSetup = () => {
    setShowStreamSetup(!showStreamSetup);
  };
  
  // Function to start stream from mobile
  const startMobileStream = () => {
    if (!streamTitle.trim()) {
      toast.error("Please enter a stream title");
      return;
    }
    
    setIsLive(true);
    setShowStreamSetup(false);
    toast.success("Mobile stream started!");
    
    // Simulate increasing viewers/chat
    setViewerCount(3);
    setChatCount(1);
  };

  // Change stream layout mode
  const changeStreamLayout = (layout: string) => {
    setStreamLayout(layout);
    toast.success(`Stream layout changed to ${layout}`);
  };
  
  // Function to copy to clipboard
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success(`${type} copied to clipboard`);
      },
      (err) => {
        toast.error(`Could not copy ${type.toLowerCase()}: ${err}`);
      }
    );
  };
  
  // Handle Go Live toggle
  const toggleLiveStatus = () => {
    if (isLive) {
      // End stream
      setIsLive(false);
      setStreamDuration(0);
      setViewerCount(0);
      setChatCount(0);
      toast.success("Stream ended");
    } else {
      if (window.innerWidth < 768) {
        // Mobile workflow - show setup dialog
        setShowStreamSetup(true);
      } else {
        // Desktop - go live directly
        setIsLive(true);
        toast.success("You're now live!");
      }
    }
  };
  
  // Effect to increment stream duration and random viewer counts while live
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isLive) {
      interval = setInterval(() => {
        setStreamDuration(prev => prev + 1);
        
        // Randomly increase viewer counts for demo purposes
        if (Math.random() > 0.7) {
          setViewerCount(prev => prev + Math.floor(Math.random() * 3));
        }
        
        // Randomly increase chat message counts for demo
        if (Math.random() > 0.6) {
          setChatCount(prev => prev + Math.floor(Math.random() * 2));
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive]);
