import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PostList from "@/components/PostList";
import { Calendar, TrendingUp } from "lucide-react";

const TopClips = () => {
  const [timeRange, setTimeRange] = useState("today");
  const [category, setCategory] = useState("all");

  return (
    <div className="min-h-screen bg-gaming-800 text-white">
      <div className="container mx-auto p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-gaming-300" />
            <h1 className="text-2xl font-bold gaming-gradient-text">Top Clips</h1>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="gaming-input w-[150px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent className="gaming-card">
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="gaming-input w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="gaming-card">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="gaming">Gaming</SelectItem>
                <SelectItem value="irl">IRL</SelectItem>
                <SelectItem value="esports">Esports</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <PostList />
        </div>
      </div>
    </div>
  );
};

export default TopClips;