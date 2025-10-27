
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ZoomInDialog } from "@/components/zoom-in-dialog";
import type { RadarItem, RadarItemType, RadarCategory, RadarDistance, RadarImpact, RadarTolerance, Organization } from "@/lib/types";
import { radarAttributes } from "@/lib/data";
import { cn } from "@/lib/utils";

interface RadarItemDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (item: RadarItem) => void;
  item: RadarItem | null;
  organizations: Organization[];
}

const defaultItem: Omit<RadarItem, 'id'> = {
  title: "",
  detection: "",
  assessment: "",
  decision: "",
  type: "Threat",
  category: "Business",
  distance: "Detected",
  impact: "Low",
  tolerance: "Medium",
  zoomInLink: "",
};

export function RadarItemDialog({ isOpen, onOpenChange, onSave, item, organizations }: RadarItemDialogProps) {
  const [formData, setFormData] = useState<Omit<RadarItem, 'id'>>(defaultItem);
  const [isZoomInOpen, setZoomInOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(item ? { ...item } : defaultItem);
    }
  }, [isOpen, item]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleRadioChange = (field: keyof typeof formData, value: string) => {
    if (value) {
      handleChange(field, value);
    }
  };

  const handleSubmit = () => {
    if (!formData.title) return;
    const finalItem: RadarItem = {
      id: item?.id || `radar-${Date.now()}`,
      ...formData,
    };
    onSave(finalItem);
    onOpenChange(false);
  };
  
  const isFormValid = formData.title.trim() !== "";
  
  const getZoomLinkOrgName = () => {
    if (!formData.zoomInLink) return "Select a radar...";
    const org = organizations.find(o => formData.zoomInLink?.includes(o.id));
    return org ? `${org.name} Radar` : "Select a radar...";
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{item ? "Edit Radar Item" : "Create New Radar Item"}</DialogTitle>
            <DialogDescription>
              Fill in the details for the radar item below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="A concise title for the item" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="detection">What have you detected?</Label>
              <Textarea id="detection" value={formData.detection} onChange={(e) => handleChange('detection', e.target.value)} placeholder="Describe the signal or event." rows={3}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assessment">What is your assessment?</Label>
              <Textarea id="assessment" value={formData.assessment} onChange={(e) => handleChange('assessment', e.target.value)} placeholder="Analyze the potential impact and implications." rows={3}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="decision">What decisions could you take?</Label>
              <Textarea id="decision" value={formData.decision} onChange={(e) => handleChange('decision', e.target.value)} placeholder="Outline potential actions or strategies." rows={3}/>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <RadioGroup value={formData.type} onValueChange={(v) => handleRadioChange('type', v as RadarItemType)} className="flex flex-wrap gap-2">
                      {radarAttributes.types.map(t => (
                          <RadioGroupItem key={t} value={t} id={`type-${t}`} className="sr-only" />
                      ))}
                      {radarAttributes.types.map(t => (
                          <Label key={t} htmlFor={`type-${t}`} className={cn("px-3 py-1.5 border rounded-md text-sm cursor-pointer", formData.type === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent' )}>{t}</Label>
                      ))}
                  </RadioGroup>
                </div>
                 <div className="space-y-2">
                  <Label>Category</Label>
                  <RadioGroup value={formData.category} onValueChange={(v) => handleRadioChange('category', v as RadarCategory)} className="flex flex-wrap gap-2">
                      {radarAttributes.categories.map(c => (
                          <RadioGroupItem key={c} value={c} id={`cat-${c}`} className="sr-only" />
                      ))}
                      {radarAttributes.categories.map(c => (
                           <Label key={c} htmlFor={`cat-${c}`} className={cn("px-3 py-1.5 border rounded-md text-sm cursor-pointer", formData.category === c ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent' )}>{c}</Label>
                      ))}
                  </RadioGroup>
                </div>
                 <div className="space-y-2">
                  <Label>Distance</Label>
                  <RadioGroup value={formData.distance} onValueChange={(v) => handleRadioChange('distance', v as RadarDistance)} className="flex flex-wrap gap-2">
                      {radarAttributes.distances.map(d => (
                          <RadioGroupItem key={d} value={d} id={`dist-${d}`} className="sr-only" />
                      ))}
                      {radarAttributes.distances.map(d => (
                           <Label key={d} htmlFor={`dist-${d}`} className={cn("px-3 py-1.5 border rounded-md text-sm cursor-pointer", formData.distance === d ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent' )}>{d}</Label>
                      ))}
                  </RadioGroup>
                </div>
                 <div className="space-y-2">
                  <Label>Impact</Label>
                  <RadioGroup value={formData.impact} onValueChange={(v) => handleRadioChange('impact', v as RadarImpact)} className="flex flex-wrap gap-2">
                      {radarAttributes.impacts.map(i => (
                          <RadioGroupItem key={i} value={i} id={`impact-${i}`} className="sr-only" />
                      ))}
                      {radarAttributes.impacts.map(i => (
                           <Label key={i} htmlFor={`impact-${i}`} className={cn("px-3 py-1.5 border rounded-md text-sm cursor-pointer", formData.impact === i ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent' )}>{i}</Label>
                      ))}
                  </RadioGroup>
                </div>
                 <div className="space-y-2">
                  <Label>Tolerance</Label>
                  <RadioGroup value={formData.tolerance} onValueChange={(v) => handleRadioChange('tolerance', v as RadarTolerance)} className="flex flex-wrap gap-2">
                      {radarAttributes.tolerances.map(t => (
                          <RadioGroupItem key={t} value={t} id={`tol-${t}`} className="sr-only" />
                      ))}
                      {radarAttributes.tolerances.map(t => (
                           <Label key={t} htmlFor={`tol-${t}`} className={cn("px-3 py-1.5 border rounded-md text-sm cursor-pointer", formData.tolerance === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent' )}>{t}</Label>
                      ))}
                  </RadioGroup>
                </div>
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="zoomInLink">Zoom In Link (Optional)</Label>
                <Button variant="outline" className="w-full justify-start font-normal" onClick={() => setZoomInOpen(true)}>
                    {getZoomLinkOrgName()}
                </Button>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" onClick={handleSubmit} disabled={!isFormValid}>
              Save Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ZoomInDialog 
        isOpen={isZoomInOpen}
        onOpenChange={setZoomInOpen}
        organizations={organizations}
        onSelect={(link) => handleChange('zoomInLink', link)}
        currentOrgId={item?.id.split('-')[1] ?? ''}
      />
    </>
  );
}
