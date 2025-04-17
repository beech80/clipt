import { motion } from 'framer-motion';

// Animation variants for Profile components
export const profileAnimations = {
  // Container animations
  containerVariants: {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  },
  
  // Item animations
  itemVariants: {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.3 } }
  },
  
  // Pulse animations
  pulseVariants: {
    pulse: {
      scale: [1, 1.05, 1],
      opacity: [0.8, 1, 0.8],
      transition: { duration: 2, repeat: Infinity }
    }
  },

  // Hover effects
  hoverVariants: {
    hover: { scale: 1.05, boxShadow: "0 0 15px rgba(92, 225, 255, 0.5)", transition: { duration: 0.2 } },
    tap: { scale: 0.95, transition: { duration: 0.2 } }
  },
  
  // Text glow animations
  textGlowVariants: {
    glow: { 
      textShadow: ["0 0 2px #5ce1ff", "0 0 8px #5ce1ff", "0 0 2px #5ce1ff"],
      color: ["#ffffff", "#a8edff", "#ffffff"],
      transition: { duration: 3, repeat: Infinity }
    }
  },

  // Trophy shine effect
  trophyShineVariants: {
    shine: {
      backgroundPosition: ["200% 0", "-200% 0", "200% 0"],
      transition: { duration: 3, repeat: Infinity }
    }
  },
  
  // Tab hover animation
  tabHoverVariants: {
    hover: { 
      scale: 1.05, 
      backgroundColor: "rgba(92, 225, 255, 0.2)",
      boxShadow: "0 0 10px rgba(92, 225, 255, 0.3)",
      transition: { duration: 0.2 } 
    },
    tap: { 
      scale: 0.95, 
      transition: { duration: 0.1 } 
    }
  },
  
  // Button animation
  buttonVariants: {
    hover: { 
      scale: 1.05, 
      boxShadow: "0 0 15px rgba(92, 225, 255, 0.7)",
      transition: { duration: 0.2 } 
    },
    tap: { 
      scale: 0.95, 
      boxShadow: "0 0 5px rgba(92, 225, 255, 0.9)",
      transition: { duration: 0.1 } 
    }
  },
  
  // Loading animation
  loadingVariants: {
    loading: {
      rotate: 360,
      transition: { 
        duration: 1, 
        repeat: Infinity, 
        ease: "linear" 
      }
    }
  },
  
  // Post grid stagger animation
  postGridVariants: {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.08
      }
    }
  },
  
  // Post card animation
  postCardVariants: {
    hidden: { 
      opacity: 0, 
      scale: 0.9,
      y: 20 
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: { 
        type: "spring",
        damping: 15,
        stiffness: 200
      }
    },
    hover: {
      y: -5,
      scale: 1.05,
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
      transition: {
        type: "spring",
        stiffness: 300
      }
    },
    tap: {
      scale: 0.98
    }
  }
};

// Styled components using Framer Motion
export const RetroProfileWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div 
    className="profile-scanlines"
    initial="hidden"
    animate="visible"
    variants={profileAnimations.containerVariants}
  >
    {children}
  </motion.div>
);

export const RetroLoader = () => (
  <motion.div 
    className="p-4 w-full flex flex-col items-center justify-center"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.5 }}
  >
    <motion.div 
      className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full pixel-spinner"
      animate="loading"
      variants={profileAnimations.loadingVariants}
    />
    <motion.p 
      className="mt-4 text-gaming-300"
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      Loading profile...
    </motion.p>
  </motion.div>
);

export const RetroTab = ({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <motion.button
    className={`flex flex-col items-center justify-center p-2 rounded transition-colors profile-tab ${
      active ? 'bg-gaming-700 text-white active' : 'bg-gaming-800 text-gaming-400 hover:bg-gaming-700 hover:text-white'
    }`}
    onClick={onClick}
    variants={profileAnimations.tabHoverVariants}
    whileHover="hover"
    whileTap="tap"
  >
    {children}
  </motion.button>
);

export const RetroProfileHeader = ({ 
  profile, 
  stats, 
  isOwnProfile, 
  handleFollowToggle, 
  user, 
  loading 
}: any) => (
  <motion.div 
    className="gaming-card p-6 mb-6"
    variants={profileAnimations.itemVariants}
  >
    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
      <motion.div 
        className="relative avatar-glow"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gaming-800 overflow-hidden border-4 border-gaming-500">
          {profile.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt={profile.username || 'User'} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gaming-700 text-4xl font-bold text-gaming-300">
              {(profile.username?.[0] || profile.display_name?.[0] || 'U').toUpperCase()}
            </div>
          )}
        </div>
      </motion.div>
      
      <div className="flex-1">
        <motion.div 
          className="flex flex-col md:flex-row gap-4 items-center md:items-start justify-between"
          variants={profileAnimations.itemVariants}
        >
          <div className="text-center md:text-left">
            <motion.h1 
              className="text-2xl font-bold text-gaming-200 mb-1 text-glow-blue"
              animate="glow"
              variants={profileAnimations.textGlowVariants}
            >
              {profile.display_name || profile.username || 'User'}
            </motion.h1>
            <UserLink username={profile.username} />
            <motion.p 
              className="text-gaming-300 max-w-md mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {profile.bio || 'No bio provided'}
            </motion.p>
          </div>
          
          <div className="flex justify-end gap-2">
            {isOwnProfile ? (
              <motion.div
                whileHover="hover"
                whileTap="tap"
                variants={profileAnimations.buttonVariants}
              >
                <Button 
                  onClick={() => window.location.href='/profile/edit'} 
                  variant="outline" 
                  className="flex items-center gap-2 bg-gray-900 border border-white/10 text-white hover:bg-gray-800 px-4 py-1 rounded-sm"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Button>
              </motion.div>
            ) : (
              <motion.div
                whileHover="hover"
                whileTap="tap"
                variants={profileAnimations.buttonVariants}
              >
                <Button
                  onClick={handleFollowToggle}
                  variant="outline"
                  className="flex items-center gap-2 follow-button"
                  disabled={!user || loading}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{isOwnProfile ? 'Edit Profile' : 'Follow'}</span>
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
        
        <motion.div 
          className="flex justify-center md:justify-start gap-6 mt-4"
          variants={profileAnimations.itemVariants}
        >
          <motion.div 
            className="text-center stats-counter"
            whileHover={{ scale: 1.05 }}
          >
            <p className="text-gaming-200 font-bold">{stats.followers}</p>
            <p className="text-gaming-400 text-sm">Followers</p>
          </motion.div>
          <motion.div 
            className="text-center stats-counter"
            whileHover={{ scale: 1.05 }}
          >
            <p className="text-gaming-200 font-bold">{stats.following}</p>
            <p className="text-gaming-400 text-sm">Following</p>
          </motion.div>
          <motion.div 
            className="text-center stats-counter"
            whileHover={{ scale: 1.05 }}
          >
            <p className="text-gaming-200 font-bold">{stats.achievements}</p>
            <p className="text-gaming-400 text-sm">Achievements</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  </motion.div>
);

export const RetroTabs = ({ 
  activeTab, 
  setActiveTab 
}: { 
  activeTab: string; 
  setActiveTab: (tab: any) => void; 
}) => (
  <motion.div 
    className="grid grid-cols-4 gap-2 mb-6 bg-gaming-900 rounded-lg p-2"
    variants={profileAnimations.itemVariants}
  >
    <RetroTab
      active={activeTab === 'posts'}
      onClick={() => setActiveTab('posts')}
    >
      <LayoutGrid className="w-6 h-6 mb-1" />
      <span className="text-xs">Posts</span>
    </RetroTab>
    
    <RetroTab
      active={activeTab === 'clips'}
      onClick={() => setActiveTab('clips')}
    >
      <Film className="w-6 h-6 mb-1" />
      <span className="text-xs">Clips</span>
    </RetroTab>
    
    <RetroTab
      active={activeTab === 'trophies'}
      onClick={() => setActiveTab('trophies')}
    >
      <Trophy className="w-6 h-6 mb-1" />
      <span className="text-xs">Trophies</span>
    </RetroTab>
    
    <RetroTab
      active={activeTab === 'bookmarks'}
      onClick={() => setActiveTab('bookmarks')}
    >
      <Bookmark className="w-6 h-6 mb-1" />
      <span className="text-xs">Saved</span>
    </RetroTab>
  </motion.div>
);

export const RetroCardGrid = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    className="posts-arcade"
    variants={profileAnimations.postGridVariants}
    initial="hidden"
    animate="visible"
  >
    {children}
  </motion.div>
);

export const RetroEmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  actionButton = null 
}: { 
  icon: any; 
  title: string; 
  description: string; 
  actionButton?: React.ReactNode; 
}) => (
  <motion.div
    className="profile-empty-state"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.2 }}
    variants={profileAnimations.pulseVariants}
    animate="pulse"
  >
    <Icon className="w-16 h-16 text-gray-400 mb-4 neon-glow" />
    <h3 className="text-xl font-bold text-gaming-100 mb-2 neon-text">{title}</h3>
    <p className="text-gaming-300">{description}</p>
    {actionButton}
  </motion.div>
);
