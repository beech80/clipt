import React from 'react';
import { motion } from 'framer-motion';
import { Film, Trophy, LayoutGrid, Bookmark, MessageSquare } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ProfilePostsGrid from './ProfilePostsGrid';
import SimpleAchievements from './achievements/SimpleAchievements';

interface TabsProps {
  activeTab: 'posts' | 'clips' | 'trophies' | 'bookmarks';
  setActiveTab: (tab: 'posts' | 'clips' | 'trophies' | 'bookmarks') => void;
  userPosts: any[];
  userCollection: any[];
  savedVideos: any[];
  isOwnProfile: boolean;
  isLoading: boolean;
}

const ProfileTabsSection: React.FC<TabsProps> = ({
  activeTab,
  setActiveTab,
  userPosts,
  userCollection,
  savedVideos,
  isOwnProfile,
  isLoading
}) => {
  // Animation variants
  const tabVariants = {
    inactive: { 
      y: 0,
      opacity: 0.7,
      transition: { duration: 0.3 } 
    },
    active: { 
      y: 0,
      opacity: 1,
      transition: { duration: 0.3 } 
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="mt-6"
    >
      <Tabs 
        defaultValue={activeTab} 
        onValueChange={(value) => setActiveTab(value as 'posts' | 'clips' | 'trophies' | 'bookmarks')}
        className="w-full"
      >
        <TabsList className="profile-tab-list grid grid-cols-4 gap-1 p-1">
          <TabsTrigger 
            value="posts" 
            className="profile-tab flex flex-col items-center py-2 px-0"
          >
            <motion.div
              variants={tabVariants}
              animate={activeTab === 'posts' ? 'active' : 'inactive'}
              className="flex flex-col items-center"
            >
              <LayoutGrid className="h-5 w-5 mb-1" />
              <span className="text-xs">POSTS</span>
            </motion.div>
          </TabsTrigger>
          
          <TabsTrigger 
            value="clips" 
            className="profile-tab flex flex-col items-center py-2 px-0"
          >
            <motion.div
              variants={tabVariants}
              animate={activeTab === 'clips' ? 'active' : 'inactive'}
              className="flex flex-col items-center"
            >
              <Film className="h-5 w-5 mb-1" />
              <span className="text-xs">CLIPS</span>
            </motion.div>
          </TabsTrigger>
          
          <TabsTrigger 
            value="trophies" 
            className="profile-tab flex flex-col items-center py-2 px-0"
          >
            <motion.div
              variants={tabVariants}
              animate={activeTab === 'trophies' ? 'active' : 'inactive'}
              className="flex flex-col items-center"
              whileHover={{ y: -2 }}
            >
              <Trophy className="h-5 w-5 mb-1" />
              <span className="text-xs">TROPHIES</span>
            </motion.div>
          </TabsTrigger>
          
          <TabsTrigger 
            value="bookmarks" 
            className="profile-tab flex flex-col items-center py-2 px-0"
          >
            <motion.div
              variants={tabVariants}
              animate={activeTab === 'bookmarks' ? 'active' : 'inactive'}
              className="flex flex-col items-center"
            >
              <Bookmark className="h-5 w-5 mb-1" />
              <span className="text-xs">SAVED</span>
            </motion.div>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="posts" className="m-0">
            <ProfilePostsGrid 
              posts={userPosts} 
              isLoading={isLoading} 
              isOwnProfile={isOwnProfile} 
            />
          </TabsContent>
          
          <TabsContent value="clips" className="m-0">
            <ProfilePostsGrid 
              posts={userCollection} 
              isLoading={isLoading} 
              isOwnProfile={isOwnProfile} 
            />
          </TabsContent>
          
          <TabsContent value="trophies" className="m-0">
            <div className="w-full p-2">
              <SimpleAchievements />
            </div>
          </TabsContent>
          
          <TabsContent value="bookmarks" className="m-0">
            <ProfilePostsGrid 
              posts={savedVideos} 
              isLoading={isLoading} 
              isOwnProfile={isOwnProfile} 
            />
          </TabsContent>
        </div>
      </Tabs>
    </motion.div>
  );
};

export default ProfileTabsSection;
