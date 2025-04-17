import React, { useState } from "react";
import { BackButton } from "@/components/ui/back-button";
import { Trophy } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import styled from "styled-components";

// Styling components
const PageContainer = styled.div`
  min-height: 100vh;
  background: #1a0e35;
  color: white;
  padding-bottom: 2rem;
`;

const Header = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  background: #1a0e35;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ffc107;
  font-weight: bold;
  font-size: 1.2rem;
`;

const TabsContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 4rem;
  margin-bottom: 1.5rem;
`;

const TabButton = styled.button<{ isActive: boolean }>`
  background: ${props => props.isActive ? '#6c5ce7' : '#483885'};
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: ${props => props.isActive ? 'bold' : 'normal'};
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  
  &:not(:last-child) {
    margin-right: 0.5rem;
  }

  &:hover {
    background: #6c5ce7;
  }
`;

const SubTitle = styled.h2`
  color: #ffc107;
  font-size: 1.2rem;
  font-weight: bold;
  margin: 1rem 0 1.5rem;
  padding-left: 1rem;
`;

const RankList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 600px;
  margin: 0 auto;
  padding: 0 1rem;
`;

const RankItem = styled.div<{ rank: number }>`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: 0.25rem;
  background: #332160;
  position: relative;
  
  /* Different styling for different ranks */
  ${props => {
    if (props.rank === 1) {
      return `
        background: #332160;
        border-left: 4px solid #ffd700;
      `;
    } else if (props.rank === 2) {
      return `
        background: #281c47;
        border-left: 4px solid #c0c0c0;
      `;
    } else if (props.rank === 3) {
      return `
        background: #332160;
        border-left: 4px solid #cd7f32;
      `;
    } else if (props.rank % 2 === 0) {
      return `
        background: #281c47;
        border-left: 4px solid #6c5ce7;
      `;
    } else {
      return `
        background: #332160;
        border-left: 4px solid #6c5ce7;
      `;
    }
  }}
`;

const RankNumber = styled.div<{ rank: number }>`
  font-weight: bold;
  font-size: 1.1rem;
  min-width: 1.5rem;
  color: ${props => {
    if (props.rank === 1) return '#ffd700';
    if (props.rank === 2) return '#c0c0c0';
    if (props.rank === 3) return '#cd7f32';
    return 'white';
  }};
`;

const TrophyIcon = styled(Trophy)<{ rank: number }>`
  color: ${props => {
    if (props.rank === 1) return '#ffd700';
    if (props.rank === 2) return '#c0c0c0';
    if (props.rank === 3) return '#cd7f32';
    return '#6c5ce7';
  }};
  margin: 0 1rem;
`;

const Points = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #ffc107;
  font-weight: bold;
`;

const SmallTrophy = styled(Trophy)`
  color: #ffc107;
`;

const TopClips = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'all-time'>('daily');
  
  // Mock data for rankings
  const rankings = [
    { id: 1, points: 8 },
    { id: 2, points: 8 },
    { id: 3, points: 8 },
    { id: 4, points: 8 },
    { id: 5, points: 8 },
    { id: 6, points: 8 },
    { id: 7, points: 8 },
    { id: 8, points: 8 },
    { id: 9, points: 8 },
    { id: 10, points: 8 },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  return (
    <PageContainer>
      <Header>
        <BackButton />
        <HeaderTitle>
          <Trophy size={18} />
          <span>Top Clipts</span>
        </HeaderTitle>
        <div style={{ width: 30 }} /> {/* Spacer for centering */}
      </Header>

      <TabsContainer>
        <TabButton 
          isActive={activeTab === 'daily'} 
          onClick={() => setActiveTab('daily')}
        >
          Daily
        </TabButton>
        <TabButton 
          isActive={activeTab === 'weekly'} 
          onClick={() => setActiveTab('weekly')}
        >
          Weekly
        </TabButton>
        <TabButton 
          isActive={activeTab === 'all-time'} 
          onClick={() => setActiveTab('all-time')}
        >
          All-Time
        </TabButton>
      </TabsContainer>

      <SubTitle>
        {activeTab === 'daily' ? "Today's" : activeTab === 'weekly' ? "This Week's" : "All-Time"} Top Clipts
      </SubTitle>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <RankList>
          <AnimatePresence>
            {rankings.map((rank) => (
              <motion.div key={rank.id} variants={itemVariants}>
                <RankItem rank={rank.id}>
                  <RankNumber rank={rank.id}>{rank.id}</RankNumber>
                  <TrophyIcon size={20} rank={rank.id} />
                  <Points>
                    <SmallTrophy size={14} />
                    <span>{rank.points}</span>
                  </Points>
                </RankItem>
              </motion.div>
            ))}
          </AnimatePresence>
        </RankList>
      </motion.div>
    </PageContainer>
  );
};

export default TopClips;
