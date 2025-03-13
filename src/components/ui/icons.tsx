import React from 'react';
import {
  Heart,
  MessageCircle,
  MessageSquare,
  Trophy,
  Camera,
  UserPlus,
  UserCheck,
  X,
  Home,
  Search,
  Bell,
  Upload,
  User,
  Settings,
  Video,
  Award,
  Monitor,
  TrendingUp,
  Bookmark,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  Menu,
  Mail,
  Send,
  Paperclip,
  MoreVertical,
  Edit,
  Trash,
  ThumbsUp,
  Share,
  Copy,
  Download,
  Flag,
  Lock,
  Unlock,
  Shield,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Power,
  Moon,
  Sun,
  Zap,
  Star
} from 'lucide-react';

// Standard icon props interface
interface IconBaseProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: string | number;
  color?: string;
  fill?: string;
}

// Export direct wrapper components for each icon
export const HeartIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <Heart ref={ref} {...props} />;
});
HeartIcon.displayName = 'HeartIcon';

export const MessageCircleIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <MessageCircle ref={ref} {...props} />;
});
MessageCircleIcon.displayName = 'MessageCircleIcon';

export const MessageIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <MessageSquare ref={ref} {...props} />;
});
MessageIcon.displayName = 'MessageIcon';

export const TrophyIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <Trophy ref={ref} {...props} />;
});
TrophyIcon.displayName = 'TrophyIcon';

export const CameraIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <Camera ref={ref} {...props} />;
});
CameraIcon.displayName = 'CameraIcon';

export const UserPlusIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <UserPlus ref={ref} {...props} />;
});
UserPlusIcon.displayName = 'UserPlusIcon';

export const UserCheckIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <UserCheck ref={ref} {...props} />;
});
UserCheckIcon.displayName = 'UserCheckIcon';

export const CloseIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <X ref={ref} {...props} />;
});
CloseIcon.displayName = 'CloseIcon';

export const HomeIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <Home ref={ref} {...props} />;
});
HomeIcon.displayName = 'HomeIcon';

export const SearchIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <Search ref={ref} {...props} />;
});
SearchIcon.displayName = 'SearchIcon';

export const BellIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <Bell ref={ref} {...props} />;
});
BellIcon.displayName = 'BellIcon';

export const UploadIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <Upload ref={ref} {...props} />;
});
UploadIcon.displayName = 'UploadIcon';

export const UserIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <User ref={ref} {...props} />;
});
UserIcon.displayName = 'UserIcon';

export const SettingsIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <Settings ref={ref} {...props} />;
});
SettingsIcon.displayName = 'SettingsIcon';

export const VideoIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <Video ref={ref} {...props} />;
});
VideoIcon.displayName = 'VideoIcon';

export const AwardIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <Award ref={ref} {...props} />;
});
AwardIcon.displayName = 'AwardIcon';

export const MonitorIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <Monitor ref={ref} {...props} />;
});
MonitorIcon.displayName = 'MonitorIcon';

export const TrendingUpIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <TrendingUp ref={ref} {...props} />;
});
TrendingUpIcon.displayName = 'TrendingUpIcon';

export const BookmarkIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <Bookmark ref={ref} {...props} />;
});
BookmarkIcon.displayName = 'BookmarkIcon';

export const CheckIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <Check ref={ref} {...props} />;
});
CheckIcon.displayName = 'CheckIcon';

export const ChevronDownIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <ChevronDown ref={ref} {...props} />;
});
ChevronDownIcon.displayName = 'ChevronDownIcon';

export const ChevronUpIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <ChevronUp ref={ref} {...props} />;
});
ChevronUpIcon.displayName = 'ChevronUpIcon';

export const ChevronLeftIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <ChevronLeft ref={ref} {...props} />;
});
ChevronLeftIcon.displayName = 'ChevronLeftIcon';

export const ChevronRightIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <ChevronRight ref={ref} {...props} />;
});
ChevronRightIcon.displayName = 'ChevronRightIcon';

export const ClockIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <Clock ref={ref} {...props} />;
});
ClockIcon.displayName = 'ClockIcon';

export const CalendarIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <Calendar ref={ref} {...props} />;
});
CalendarIcon.displayName = 'CalendarIcon';

export const MenuIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <Menu ref={ref} {...props} />;
});
MenuIcon.displayName = 'MenuIcon';

export const MailIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <Mail ref={ref} {...props} />;
});
MailIcon.displayName = 'MailIcon';

export const SendIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <Send ref={ref} {...props} />;
});
SendIcon.displayName = 'SendIcon';

export const PaperclipIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <Paperclip ref={ref} {...props} />;
});
PaperclipIcon.displayName = 'PaperclipIcon';

export const MoreVerticalIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <MoreVertical ref={ref} {...props} />;
});
MoreVerticalIcon.displayName = 'MoreVerticalIcon';

export const MoreIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <MoreVertical ref={ref} {...props} />;
});
MoreIcon.displayName = 'MoreIcon';

export const EditIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <Edit ref={ref} {...props} />;
});
EditIcon.displayName = 'EditIcon';

export const TrashIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <Trash ref={ref} {...props} />;
});
TrashIcon.displayName = 'TrashIcon';

export const ThumbsUpIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <ThumbsUp ref={ref} {...props} />;
});
ThumbsUpIcon.displayName = 'ThumbsUpIcon';

export const ShareIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <Share ref={ref} {...props} />;
});
ShareIcon.displayName = 'ShareIcon';

export const CopyIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <Copy ref={ref} {...props} />;
});
CopyIcon.displayName = 'CopyIcon';

export const DownloadIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <Download ref={ref} {...props} />;
});
DownloadIcon.displayName = 'DownloadIcon';

export const FlagIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <Flag ref={ref} {...props} />;
});
FlagIcon.displayName = 'FlagIcon';

export const LockIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <Lock ref={ref} {...props} />;
});
LockIcon.displayName = 'LockIcon';

export const UnlockIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <Unlock ref={ref} {...props} />;
});
UnlockIcon.displayName = 'UnlockIcon';

export const ShieldIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <Shield ref={ref} {...props} />;
});
ShieldIcon.displayName = 'ShieldIcon';

export const AlertCircleIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <AlertCircle ref={ref} {...props} />;
});
AlertCircleIcon.displayName = 'AlertCircleIcon';

export const HelpCircleIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <HelpCircle ref={ref} {...props} />;
});
HelpCircleIcon.displayName = 'HelpCircleIcon';

export const ArrowRightIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <ArrowRight ref={ref} {...props} />;
});
ArrowRightIcon.displayName = 'ArrowRightIcon';

export const ArrowLeftIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <ArrowLeft ref={ref} {...props} />;
});
ArrowLeftIcon.displayName = 'ArrowLeftIcon';

export const PowerIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <Power ref={ref} {...props} />;
});
PowerIcon.displayName = 'PowerIcon';

export const MoonIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <Moon ref={ref} {...props} />;
});
MoonIcon.displayName = 'MoonIcon';

export const SunIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <Sun ref={ref} {...props} />;
});
SunIcon.displayName = 'SunIcon';

export const ZapIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <Zap ref={ref} {...props} />;
});
ZapIcon.displayName = 'ZapIcon';

export const StarIcon = React.forwardRef<SVGSVGElement, IconBaseProps>((props, ref) => {
  return <Star ref={ref} {...props} />;
});
StarIcon.displayName = 'StarIcon';
