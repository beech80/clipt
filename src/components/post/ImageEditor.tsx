import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { 
  Contrast, 
  Sun, 
  Droplet, 
  Palette,
  Check
} from "lucide-react";

interface ImageEditorProps {
  imageFile: File;
  onSave: (editedImage: Blob) => void;
}

const ImageEditor = ({ imageFile, onSave }: ImageEditorProps) => {
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  const applyFilters = async () => {
    try {
      const image = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      image.src = URL.createObjectURL(imageFile);
      await new Promise((resolve) => {
        image.onload = resolve;
      });

      canvas.width = image.width;
      canvas.height = image.height;

      if (ctx) {
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
        ctx.drawImage(image, 0, 0, image.width, image.height);

        canvas.toBlob((blob) => {
          if (blob) {
            onSave(blob);
            toast.success("Image edited successfully!");
          }
        }, 'image/jpeg', 0.95);
      }
    } catch (error) {
      toast.error("Error editing image");
      console.error("Error editing image:", error);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg">
      <img
        src={URL.createObjectURL(imageFile)}
        alt="Preview"
        className="w-full rounded-lg"
        style={{
          filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
        }}
      />

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Sun className="h-4 w-4" /> Brightness
            </label>
            <Slider
              value={[brightness]}
              min={0}
              max={200}
              step={1}
              onValueChange={([value]) => setBrightness(value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Contrast className="h-4 w-4" /> Contrast
            </label>
            <Slider
              value={[contrast]}
              min={0}
              max={200}
              step={1}
              onValueChange={([value]) => setContrast(value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Palette className="h-4 w-4" /> Saturation
            </label>
            <Slider
              value={[saturation]}
              min={0}
              max={200}
              step={1}
              onValueChange={([value]) => setSaturation(value)}
            />
          </div>
        </div>

        <Button 
          onClick={applyFilters}
          className="w-full"
        >
          <Check className="h-4 w-4 mr-2" />
          Apply Changes
        </Button>
      </div>
    </div>
  );
};

export default ImageEditor;