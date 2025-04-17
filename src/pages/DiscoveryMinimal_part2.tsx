// Part 2: Sample Data and Handlers
  
  // Extended game library - sample popular games
  const gameLibrary = [
    { id: '1', name: 'Fortnite', coverUrl: 'https://m.media-amazon.com/images/I/81ZUXM0C+fL._AC_UF1000,1000_QL80_.jpg', viewerCount: 245300, cover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1tmu.jpg', background: 'https://images.igdb.com/igdb/image/upload/t_screenshot_huge/sc8drr.jpg' },
    { id: '2', name: 'Valorant', coverUrl: 'https://m.media-amazon.com/images/I/71inTnKHDrL._AC_UF1000,1000_QL80_.jpg', viewerCount: 183450, cover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co49x5.jpg', background: 'https://images.igdb.com/igdb/image/upload/t_screenshot_huge/sc7hsx.jpg' },
    { id: '3', name: 'League of Legends', coverUrl: 'https://cdn1.epicgames.com/offer/24b9b5e323bc40eea252a10cdd3b2f10/LOL_2560x1440-98749e0d718e82d27a084941939bc9d3', viewerCount: 321500, cover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co245r.jpg', background: 'https://images.igdb.com/igdb/image/upload/t_screenshot_huge/sc6o8u.jpg' },
    { id: '4', name: 'Call of Duty: Warzone', coverUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202211/0914/N9VGDkhFJi90QZZd2YYbJk9U.png', viewerCount: 156700, cover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wr6.jpg', background: 'https://images.igdb.com/igdb/image/upload/t_screenshot_huge/sc6qky.jpg' },
    { id: '5', name: 'Minecraft', coverUrl: 'https://image.api.playstation.com/vulcan/img/rnd/202010/2621/FQLAGvB7yVKiY36MmdHrBVL8.png', viewerCount: 98400, cover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co49x5.jpg', background: 'https://images.igdb.com/igdb/image/upload/t_screenshot_huge/sc7hsx.jpg' },
    { id: '6', name: 'Apex Legends', coverUrl: 'https://media.contentapi.ea.com/content/dam/apex-legends/images/2019/01/apex-featured-image-16x9.jpg.adapt.crop16x9.1023w.jpg', viewerCount: 142300, cover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2ekt.jpg', background: 'https://images.igdb.com/igdb/image/upload/t_screenshot_huge/sc6mfy.jpg' },
  ];

  // Sample streamers for demo
  const streamers = [
    {
      id: '1',
      name: 'Pro Gamer',
      game: 'Fortnite',
      viewers: 12453,
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      followers: 1200000,
      gameId: 'fort123',
      gameCover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1tmu.jpg',
      gameBanner: 'https://images.igdb.com/igdb/image/upload/t_screenshot_huge/sc8drr.jpg'
    },
    {
      id: '2',
      name: 'Epic Streamer',
      game: 'Minecraft',
      viewers: 8721,
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      followers: 980000,
      gameId: 'mine456',
      gameCover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co49x5.jpg',
      gameBanner: 'https://images.igdb.com/igdb/image/upload/t_screenshot_huge/sc7hsx.jpg'
    },
    {
      id: '3',
      name: 'Gaming Legend',
      game: 'League of Legends',
      viewers: 15302,
      avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
      followers: 1500000,
      gameId: 'lol789',
      gameCover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co245r.jpg',
      gameBanner: 'https://images.igdb.com/igdb/image/upload/t_screenshot_huge/sc6o8u.jpg'
    },
    {
      id: '4',
      name: 'Awesome Player',
      game: 'Call of Duty',
      viewers: 7182,
      avatar: 'https://randomuser.me/api/portraits/women/29.jpg',
      followers: 850000,
      gameId: 'cod321',
      gameCover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wr6.jpg',
      gameBanner: 'https://images.igdb.com/igdb/image/upload/t_screenshot_huge/sc6qky.jpg'
    },
    {
      id: '5',
      name: 'Game Master',
      game: 'Apex Legends',
      viewers: 9283,
      avatar: 'https://randomuser.me/api/portraits/men/42.jpg',
      followers: 1100000,
      gameId: 'apex654',
      gameCover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2ekt.jpg',
      gameBanner: 'https://images.igdb.com/igdb/image/upload/t_screenshot_huge/sc6mfy.jpg'
    }
  ];
  
  // Current streamer based on index
  const currentStreamer = streamers[currentIndex];

  // Navigation handlers
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % streamers.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + streamers.length) % streamers.length);
  };

  // Chat handlers
  const handleToggleChat = () => {
    setShowChat(!showChat);
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const newMsg = {
        id: `msg-${Date.now()}`,
        user: 'You',
        text: newMessage,
        isCurrentUser: true
      };
      setChatMessages([...chatMessages, newMsg]);
      setNewMessage('');
    }
  };

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
