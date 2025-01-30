import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PostList from "@/components/PostList";
import { Calendar, TrendingUp } from "lucide-react";
import GameBoyControls from "@/components/GameBoyControls";

const TopClips = () => {
  const [timeRange, setTimeRange] = useState("today");
  const [category, setCategory] = useState("all");

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="gameboy-header">
        <h1 className="gameboy-title">TOP CLIPS</h1>
      </div>

      <div className="mt-20 flex justify-end gap-2">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[150px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="gaming">Gaming</SelectItem>
            <SelectItem value="irl">IRL</SelectItem>
            <SelectItem value="esports">Esports</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 pb-[200px]">
        <PostList />
      </div>

      <GameBoyControls />
    </div>
  );
};

export default TopClips;