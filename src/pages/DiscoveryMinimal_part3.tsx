// Part 3: More Handlers and Effects

  // Follow/Unfollow handler
  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    if (!isFollowing) {
      toast.success(`You are now following ${currentStreamer.name}!`);
    } else {
      toast.info(`You have unfollowed ${currentStreamer.name}.`);
    }
  };
  
  // Donation handlers
  const handleDonateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const amount = parseFloat(donationAmount);
    if (amount > 0) {
      toast.success(`Thank you for your $${amount} donation to ${currentStreamer.name}!`);
      setShowDonateForm(false);
    }
  };

  // Handle clip recording
  const handleRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordingProgress(0);
      toast.info(`Started recording a clip...`);
      
      // Simulate progress
      recordingInterval.current = setInterval(() => {
        setRecordingProgress(prev => {
          if (prev >= 100) {
            if (recordingInterval.current) {
              clearInterval(recordingInterval.current);
            }
            setIsRecording(false);
            toast.success(`Clip saved successfully!`);
            return 0;
          }
          return prev + 5;
        });
      }, 500);
    } else {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
      setIsRecording(false);
      setRecordingProgress(0);
      toast.success(`Clip saved successfully!`);
    }
  };
  
  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, []);
  
  // Handle game selection
  const handleGameSelect = (game: any) => {
    setSelectedGame(game);
    setSearchOpen(false);
    toast.success(`Selected ${game.name}`);
  };

  // Search for games when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      setIsLoading(true);
      // Simulate search delay
      const timer = setTimeout(() => {
        const results = gameLibrary.filter(game =>
          game.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(results);
        setIsLoading(false);
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, gameLibrary]);
