import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, FileVideo, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface BatchJob {
  id: string;
  status: string;
  job_type: string;
  total_items: number;
  processed_items: number;
  settings: any;
  created_at: string;
}

interface BatchItem {
  id: string;
  file_path: string;
  status: string;
  error_message?: string;
  output_path?: string;
  processing_time?: number;
}

export const BatchProcessingManager = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const queryClient = useQueryClient();

  const { data: activeJobs, isLoading } = useQuery({
    queryKey: ['batch-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batch_processing_jobs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BatchJob[];
    }
  });

  const createBatchJob = useMutation({
    mutationFn: async (files: File[]) => {
      // Create the batch job
      const { data: job, error: jobError } = await supabase
        .from('batch_processing_jobs')
        .insert({
          job_type: 'video_processing',
          total_items: files.length,
          status: 'processing'
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Upload files and create batch items
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const filePath = `${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { error: itemError } = await supabase
          .from('batch_processing_items')
          .insert({
            job_id: job.id,
            file_path: filePath,
            status: 'pending'
          });

        if (itemError) throw itemError;
      });

      await Promise.all(uploadPromises);
      return job;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch-jobs'] });
      toast.success('Batch processing started');
      setSelectedFiles([]);
    },
    onError: (error) => {
      console.error('Batch processing error:', error);
      toast.error('Failed to start batch processing');
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const handleStartProcessing = () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to process');
      return;
    }
    createBatchJob.mutate(selectedFiles);
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Batch Processing</h2>
        <div className="flex items-center gap-4">
          <input
            type="file"
            multiple
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
            id="batch-file-input"
          />
          <label htmlFor="batch-file-input">
            <Button variant="outline" asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Select Files
              </span>
            </Button>
          </label>
          <Button
            onClick={handleStartProcessing}
            disabled={selectedFiles.length === 0 || createBatchJob.isPending}
          >
            {createBatchJob.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileVideo className="w-4 h-4 mr-2" />
            )}
            Process {selectedFiles.length} Files
          </Button>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Selected {selectedFiles.length} files
          </p>
          <ul className="text-sm space-y-1">
            {selectedFiles.map((file, index) => (
              <li key={index} className="text-muted-foreground">
                {file.name} ({Math.round(file.size / 1024 / 1024)}MB)
              </li>
            ))}
          </ul>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {activeJobs?.map((job) => (
            <Card key={job.id} className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium">Batch Job {job.id.slice(0, 8)}</h3>
                  <p className="text-sm text-muted-foreground">
                    Created {new Date(job.created_at).toLocaleString()}
                  </p>
                </div>
                <span className="text-sm px-2 py-1 rounded-full bg-muted">
                  {job.status}
                </span>
              </div>
              <Progress
                value={(job.processed_items / job.total_items) * 100}
                className="h-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                {job.processed_items} of {job.total_items} items processed
              </p>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
};