import { useState } from 'react';
import { Calendar, Clock, Tag, Info, Gamepad, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

// Schema validation
const scheduleFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().max(500, 'Description cannot exceed 500 characters'),
  game_id: z.string().optional(),
  scheduled_for: z.date(),
  duration_minutes: z.coerce.number().min(15, 'Minimum duration is 15 minutes').max(720, 'Maximum duration is 12 hours'),
  tags: z.string().max(100),
  is_public: z.boolean().default(true),
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

interface Game {
  id: string;
  name: string;
}

interface ScheduleStreamProps {
  onSuccess?: () => void;
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost';
  buttonSize?: 'default' | 'sm' | 'lg';
  buttonText?: string;
  className?: string;
}

export function ScheduleStream({ 
  onSuccess, 
  buttonVariant = 'default',
  buttonSize = 'default',
  buttonText = 'Schedule Stream',
  className = '',
}: ScheduleStreamProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(false);
  const queryClient = useQueryClient();
  
  // Initialize form
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      title: '',
      description: '',
      game_id: undefined,
      scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      duration_minutes: 60,
      tags: '',
      is_public: true,
    },
  });

  // Fetch games when dialog opens
  const fetchGames = async () => {
    if (games.length > 0) return;
    
    setIsLoadingGames(true);
    try {
      const { data, error } = await supabase
        .from('games')
        .select('id, name')
        .order('name', { ascending: true })
        .limit(100);
        
      if (error) throw error;
      setGames(data || []);
    } catch (error) {
      console.error('Error fetching games:', error);
      toast.error('Failed to load games');
    } finally {
      setIsLoadingGames(false);
    }
  };

  // Mutation for scheduling a stream
  const scheduleMutation = useMutation({
    mutationFn: async (values: ScheduleFormValues) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('scheduled_streams')
        .insert({
          user_id: user.id,
          title: values.title,
          description: values.description,
          game_id: values.game_id || null,
          scheduled_for: values.scheduled_for.toISOString(),
          duration_minutes: values.duration_minutes,
          tags: values.tags ? values.tags.split(',').map(tag => tag.trim()) : [],
          is_public: values.is_public,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Stream scheduled successfully!');
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['scheduled-streams'] });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error('Error scheduling stream:', error);
      toast.error('Failed to schedule stream');
    },
  });

  const onSubmit = (values: ScheduleFormValues) => {
    scheduleMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={buttonVariant} 
          size={buttonSize}
          className={className}
          onClick={() => fetchGames()}
        >
          <Calendar className="h-4 w-4 mr-2" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Schedule a Stream</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stream Title</FormLabel>
                  <FormControl>
                    <Input placeholder="My Awesome Stream" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell viewers what your stream will be about..." 
                      {...field} 
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="game_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Game</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a game" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">-- Not Game Specific --</SelectItem>
                        {isLoadingGames ? (
                          <SelectItem value="" disabled>Loading games...</SelectItem>
                        ) : (
                          games.map(game => (
                            <SelectItem key={game.id} value={game.id}>
                              {game.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="60" 
                        {...field} 
                        min={15}
                        max={720}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="scheduled_for"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date and Time</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(field.value, "PPP p")
                          ) : (
                            <span>Pick a date and time</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          if (date) {
                            // Keep the time part from the existing date
                            const newDate = new Date(date);
                            if (field.value) {
                              newDate.setHours(field.value.getHours());
                              newDate.setMinutes(field.value.getMinutes());
                            }
                            field.onChange(newDate);
                          }
                        }}
                        initialFocus
                      />
                      <div className="p-3 border-t">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-xs">Time</FormLabel>
                          <Input
                            type="time"
                            value={
                              field.value
                                ? `${String(field.value.getHours()).padStart(2, '0')}:${String(field.value.getMinutes()).padStart(2, '0')}`
                                : '12:00'
                            }
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(':').map(Number);
                              const newDate = new Date(field.value || new Date());
                              newDate.setHours(hours);
                              newDate.setMinutes(minutes);
                              field.onChange(newDate);
                            }}
                            className="w-24 text-xs"
                          />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="gaming, speedrun, tutorial" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Separate tags with commas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="is_public"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Public Schedule
                    </FormLabel>
                    <FormDescription>
                      Allow your schedule to appear on your profile and in search
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button 
                type="submit" 
                disabled={scheduleMutation.isPending}
              >
                {scheduleMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Schedule Stream
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Additional components needed
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

export default ScheduleStream;
