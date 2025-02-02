import React from 'react';
import Home from '@/pages/Home';
import Messages from '@/pages/Messages';
import GroupChat from '@/pages/GroupChat';
import Integrations from '@/pages/Integrations';
import GamingAssistant from '@/pages/GamingAssistant';

export const routes = [
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/messages',
    element: <Messages />
  },
  {
    path: '/group-chat',
    element: <GroupChat />
  },
  {
    path: '/integrations',
    element: <Integrations />
  },
  {
    path: '/gaming-assistant',
    element: <GamingAssistant />
  }
];