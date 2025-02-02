import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Layers, Move, Settings, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface OverlayElement {
  id: string;
  type: 'text' | 'image' | 'widget';
  content: string;
  position: { x: number; y: number };
  style: {
    fontSize?: number;
    opacity: number;
    color?: string;
  };
}

export function OverlayDesigner() {
  const [elements, setElements] = useState<OverlayElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<OverlayElement | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const addElement = (type: OverlayElement['type']) => {
    const newElement: OverlayElement = {
      id: crypto.randomUUID(),
      type,
      content: type === 'text' ? 'New Text' : '',
      position: { x: 50, y: 50 },
      style: {
        fontSize: 16,
        opacity: 1,
        color: '#ffffff'
      }
    };
    setElements([...elements, newElement]);
    toast.success('Element added');
  };

  const updateElement = (id: string, updates: Partial<OverlayElement>) => {
    setElements(elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Overlay Designer</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {previewMode ? 'Edit Mode' : 'Preview'}
          </Button>
        </div>

        {!previewMode && (
          <div className="flex gap-2 mb-4">
            <Button onClick={() => addElement('text')}>Add Text</Button>
            <Button onClick={() => addElement('image')}>Add Image</Button>
            <Button onClick={() => addElement('widget')}>Add Widget</Button>
          </div>
        )}

        <div className="relative border rounded-lg h-[400px] bg-black/50">
          {elements.map((element) => (
            <div
              key={element.id}
              className={`absolute p-2 ${!previewMode ? 'cursor-move border border-dashed border-white/20' : ''}`}
              style={{
                left: `${element.position.x}%`,
                top: `${element.position.y}%`,
                transform: 'translate(-50%, -50%)',
                opacity: element.style.opacity
              }}
              onClick={() => !previewMode && setSelectedElement(element)}
            >
              {element.type === 'text' && (
                <span style={{ 
                  fontSize: `${element.style.fontSize}px`,
                  color: element.style.color 
                }}>
                  {element.content}
                </span>
              )}
            </div>
          ))}
        </div>

        {selectedElement && !previewMode && (
          <Card className="mt-4 p-4">
            <h3 className="font-semibold mb-2">Element Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm">Content</label>
                <Input
                  value={selectedElement.content}
                  onChange={(e) => updateElement(selectedElement.id, { 
                    content: e.target.value 
                  })}
                />
              </div>
              <div>
                <label className="text-sm">Opacity</label>
                <Slider
                  value={[selectedElement.style.opacity * 100]}
                  onValueChange={(value) => updateElement(selectedElement.id, {
                    style: { ...selectedElement.style, opacity: value[0] / 100 }
                  })}
                  max={100}
                  step={1}
                />
              </div>
              {selectedElement.type === 'text' && (
                <div>
                  <label className="text-sm">Font Size</label>
                  <Slider
                    value={[selectedElement.style.fontSize || 16]}
                    onValueChange={(value) => updateElement(selectedElement.id, {
                      style: { ...selectedElement.style, fontSize: value[0] }
                    })}
                    min={8}
                    max={72}
                    step={1}
                  />
                </div>
              )}
            </div>
          </Card>
        )}
      </Card>
    </div>
  );
}