import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Eye, EyeOff, Server, Check, Video, BarChart, Share2, Shield, Zap, Settings, ChevronLeft, 
  Users, Tv, MessageCircle, Star, GiftIcon, AlertTriangle, Rocket, Activity, Smartphone, ArrowUp, 
  TrendingUp, Radio, Globe, Menu, Play, Pause, Mic, MicOff, Camera, PanelLeft } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import CosmicChatViewer from "@/components/CosmicChatViewer";
