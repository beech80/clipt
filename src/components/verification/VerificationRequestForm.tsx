import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export function VerificationRequestForm() {
  const [evidence, setEvidence] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('verification_requests')
        .insert({
          user_id: user.id,
          evidence_urls: [evidence],
          status: 'pending'
        });

      if (error) throw error;
      toast.success("Verification request submitted successfully!");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to submit verification request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Request Verification</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Provide evidence to support your verification request
        </p>
      </div>
      <div className="space-y-2">
        <Textarea
          placeholder="Explain why you should be verified..."
          value={evidence}
          onChange={(e) => setEvidence(e.target.value)}
          required
          className="min-h-[100px]"
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Submit Request"}
      </Button>
    </form>
  );
}